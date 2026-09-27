import { describe, expect, it, vi } from "vitest";

// 会话令牌(auth.ts)的功能测试:
// 签发→校验闭环、签名篡改拒绝、载荷篡改拒绝、过期拒绝、垃圾输入不崩溃
process.env.AUTH_SECRET = "test-secret-for-vitest-only";

import { createSessionToken, verifySessionToken } from "../src/lib/auth";

function forgePayload(username: string, exp: number): string {
  // 标准 base64 去掉填充即可被 base64url 解码端接受
  return btoa(JSON.stringify({ u: username, exp }));
}

describe("会话令牌 auth.ts", () => {
  it("签发后校验通过,返回原用户名", async () => {
    const [payload, signature] = await createSessionToken("admin");
    const username = await verifySessionToken(`${payload}.${signature}`);
    expect(username).toBe("admin");
  });

  it("换一个签名的令牌被拒绝(签名不对)", async () => {
    const [payloadA, signatureA] = await createSessionToken("admin");
    const [, signatureB] = await createSessionToken("admin2");
    expect(await verifySessionToken(`${payloadA}.${signatureB}`)).toBeNull();
    expect(await verifySessionToken(`${payloadA}.${signatureA.slice(1)}x`)).toBeNull();
  });

  it("拿真签名伪造别的用户被拒绝(载荷不对)", async () => {
    const [, signature] = await createSessionToken("admin");
    const evilPayload = forgePayload("hacker", Date.now() + 60_000);
    expect(await verifySessionToken(`${evilPayload}.${signature}`)).toBeNull();
  });

  it("过期的令牌被拒绝", async () => {
    const [payload, signature] = await createSessionToken("admin");
    // 令牌有效期 30 天:把系统时间拨到 31 天后,再校验应失败
    vi.useFakeTimers();
    vi.setSystemTime(new Date(Date.now() + 31 * 24 * 60 * 60 * 1000));
    const result = await verifySessionToken(`${payload}.${signature}`);
    vi.useRealTimers();
    expect(result).toBeNull();
  });

  it("垃圾输入一律返回 null,不抛异常", async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
    expect(await verifySessionToken("garbage")).toBeNull();
    expect(await verifySessionToken("a.b.c")).toBeNull();
  });
});
