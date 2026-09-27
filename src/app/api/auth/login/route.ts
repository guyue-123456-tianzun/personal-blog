import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { users } from "@/db/schema";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: "请输入用户名和密码" }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, body.username))
    .limit(1);
  const valid = user && (await bcrypt.compare(body.password, user.passwordHash));
  if (!valid) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  const [payload, signature] = await createSessionToken(body.username);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    // M5 配好 HTTPS 后改为 true;当前用 IP + HTTP 访问,secure Cookie 不会被浏览器发送
    secure: false,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
