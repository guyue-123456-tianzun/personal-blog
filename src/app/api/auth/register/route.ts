import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, createSessionToken } from "@/lib/auth";
import { isRegistrationOpen, registerUser } from "@/lib/users";

// 注册新用户:成功后直接登录(发 30 天会话)。
// 站点定位"站长+注册用户":注册用户可以发说说、加好友;博客文章仍由站长发布。
export async function POST(request: Request) {
  if (!(await isRegistrationOpen())) {
    return NextResponse.json({ error: "站点当前未开放注册" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
    nickname?: string;
  } | null;
  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
  }

  try {
    const user = await registerUser({
      username: body.username,
      password: body.password,
      nickname: body.nickname,
    });

    const [payload, signature] = await createSessionToken(user.username);
    const response = NextResponse.json({
      ok: true,
      user: { username: user.username, nickname: user.nickname },
    });
    response.cookies.set(SESSION_COOKIE_NAME, `${payload}.${signature}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // M5 配好 HTTPS 后改为 true
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "注册失败" },
      { status: 400 },
    );
  }
}
