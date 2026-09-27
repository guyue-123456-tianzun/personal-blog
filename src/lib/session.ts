import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME, verifySessionToken } from "./auth";

// 服务端取当前登录站长。
// 页面有 middleware 拦着,API 路由再用它做第二道校验——两道锁,防的是同一把钥匙漏配
export async function getSessionUsername(): Promise<string | null> {
  return verifySessionToken(
    (await cookies()).get(SESSION_COOKIE_NAME)?.value,
  );
}
