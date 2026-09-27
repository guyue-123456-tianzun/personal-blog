import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { addTimelineEvent, deleteTimelineEvent } from "@/lib/collections";

// 成长时间线(B8):POST {action:add|delete, ...}
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    id?: number;
    date?: string;
    title?: string;
    content?: string;
  } | null;
  if (!body?.action) {
    return NextResponse.json({ error: "缺少 action" }, { status: 400 });
  }
  try {
    if (body.action === "add") {
      if (!body.date || !body.title) {
        return NextResponse.json({ error: "日期和标题不能为空" }, { status: 400 });
      }
      const row = await addTimelineEvent(user, {
        date: body.date,
        title: body.title,
        content: body.content,
      });
      return NextResponse.json({ ok: true, event: row });
    }
    if (body.action === "delete") {
      await deleteTimelineEvent(Number(body.id), user);
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
