import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME, verifySessionToken } from "./auth";
import { getUserByUsername, type SiteUser } from "./users";

// 服务端取当前登录用户(完整资料)。
// 页面有 middleware 拦着,API 路由再用它做第二道校验——两道锁,防的是同一把钥匙漏配
export async function getSessionUser(): Promise<SiteUser | null> {
  const username = await verifySessionToken(
    (await cookies()).get(SESSION_COOKIE_NAME)?.value,
  );
  if (!username) return null;
  return getUserByUsername(username);
}

/** 兼容旧调用:只要用户名 */
export async function getSessionUsername(): Promise<string | null> {
  return (await getSessionUser())?.username ?? null;
}
