import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { addBookmark, deleteBookmark } from "@/lib/collections";

// 书签(C2):POST {action:add|delete, ...}
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    id?: number;
    title?: string;
    url?: string;
    description?: string;
  } | null;
  if (!body?.action) {
    return NextResponse.json({ error: "缺少 action" }, { status: 400 });
  }
  try {
    if (body.action === "add") {
      if (!body.title || !body.url) {
        return NextResponse.json({ error: "标题和网址不能为空" }, { status: 400 });
      }
      const row = await addBookmark(user, {
        title: body.title,
        url: body.url,
        description: body.description,
      });
      return NextResponse.json({ ok: true, bookmark: row });
    }
    if (body.action === "delete") {
      await deleteBookmark(Number(body.id), user);
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
