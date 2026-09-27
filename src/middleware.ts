import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// 私有区统一守卫:未登录访问 /kb/** 一律重定向到登录页
export async function middleware(request: NextRequest) {
  const username = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );
  if (!username) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/kb", "/kb/:path*"],
};
