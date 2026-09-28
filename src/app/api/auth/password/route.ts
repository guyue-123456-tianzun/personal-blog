import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { changePassword } from "@/lib/users";

// 修改密码:必须带着旧密码来(防止被拿着忘锁的电脑乱改);
// 改完不强制下线——当前会话继续有效,其他设备下次登录用新密码
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    oldPassword?: string;
    newPassword?: string;
  } | null;
  if (!body?.oldPassword || !body?.newPassword) {
    return NextResponse.json(
      { error: "旧密码和新密码都不能为空" },
      { status: 400 },
    );
  }

  try {
    await changePassword(user.id, body.oldPassword, body.newPassword);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "修改失败" },
      { status: 400 },
    );
  }
}
