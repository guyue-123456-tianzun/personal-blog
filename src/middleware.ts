import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// 私有区统一守卫:
// - 未登录访问 /kb 页面 → 重定向到 /?login=1&next=xxx,由全局登录弹窗接管
//   (背景是当前站点虚化,视觉不断裂)
// - 未登录访问 /api/kb 接口 → 返回 401 JSON,方便前端程序处理
// - /login 旧地址统一归口到弹窗
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/?login=1", request.url));
  }

  const username = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
  if (!username) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const next = encodeURIComponent(pathname + (request.nextUrl.search || ""));
    return NextResponse.redirect(
      new URL(`/?login=1&next=${next}`, request.url),
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/kb", "/kb/:path*", "/api/kb/:path*", "/login"],
};
