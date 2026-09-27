import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { addNavLink, deleteNavLink } from "@/lib/collections";

// 导航页链接(C4):POST {action:add|delete, ...}
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    id?: number;
    name?: string;
    url?: string;
    category?: string;
  } | null;
  if (!body?.action) {
    return NextResponse.json({ error: "缺少 action" }, { status: 400 });
  }
  try {
    if (body.action === "add") {
      if (!body.name || !body.url) {
        return NextResponse.json({ error: "名称和网址不能为空" }, { status: 400 });
      }
      const row = await addNavLink(user, {
        name: body.name,
        url: body.url,
        category: body.category,
      });
      return NextResponse.json({ ok: true, link: row });
    }
    if (body.action === "delete") {
      await deleteNavLink(Number(body.id), user);
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
