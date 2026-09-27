// 会话令牌:自实现 HMAC-SHA256 签名(单管理员系统,不引入认证框架,见 docs/DEVELOPMENT.md D2/D4)
// 令牌格式:<载荷(base64url)>.<签名(base64url)>,载荷内含用户名与过期时间
// 只用 WebCrypto,同时兼容 Node 运行时与 Edge 中间件(src/middleware.ts)

const SESSION_COOKIE_NAME = "kb_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天

type SessionPayload = { u: string; exp: number };

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("缺少 AUTH_SECRET 环境变量(项目根 .env.local)");
  }
  return secret;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

/** 登录成功后生成会话令牌,返回 [载荷, 签名] */
export async function createSessionToken(username: string): Promise<[string, string]> {
  const payload: SessionPayload = { u: username, exp: Date.now() + SESSION_TTL_MS };
  const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return [encoded, await sign(encoded)];
}

/** 校验令牌:合法且未过期返回用户名,否则返回 null */
export async function verifySessionToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if ((await sign(payload)) !== signature) return null;
  try {
    const data = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payload)),
    ) as SessionPayload;
    if (typeof data.u !== "string" || typeof data.exp !== "number" || Date.now() > data.exp) {
      return null;
    }
    return data.u;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME, SESSION_TTL_MS };
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
