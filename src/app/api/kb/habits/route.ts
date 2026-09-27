import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import {
  createHabit,
  deleteHabit,
  toggleHabitToday,
} from "@/lib/collections";

// 习惯打卡(C3):POST {action:add-habit|toggle-today|delete-habit, ...}
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    habitId?: number;
    name?: string;
  } | null;
  if (!body?.action) {
    return NextResponse.json({ error: "缺少 action" }, { status: 400 });
  }
  try {
    if (body.action === "add-habit") {
      if (!body.name?.trim()) {
        return NextResponse.json({ error: "习惯名称不能为空" }, { status: 400 });
      }
      const row = await createHabit(user, body.name);
      return NextResponse.json({ ok: true, habit: row });
    }
    if (body.action === "toggle-today") {
      const result = await toggleHabitToday(Number(body.habitId), user);
      if (!result) {
        return NextResponse.json({ error: "习惯不存在" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, ...result });
    }
    if (body.action === "delete-habit") {
      await deleteHabit(Number(body.habitId), user);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "操作失败" },
      { status: 400 },
    );
  }
}
