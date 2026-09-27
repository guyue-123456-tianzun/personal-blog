import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth";

// 登出 = 把会话 Cookie 立刻作废(maxAge=0)
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
