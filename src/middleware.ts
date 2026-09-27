import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// 私有区统一守卫:未登录访问 /kb 页面或 /api/kb 接口一律拦下。
// 页面重定向到登录页;接口(API)按惯例返回 401 JSON,方便前端程序处理
export async function middleware(request: NextRequest) {
  const username = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
  if (!username) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/kb", "/kb/:path*", "/api/kb/:path*"],
};
