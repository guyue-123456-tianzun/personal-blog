import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { softDeleteNote, updateNote } from "@/lib/notes";

type Params = { params: Promise<{ id: string }> };

// 更新笔记。每次更新都会先把改动前的版本存进版本历史(snapshot 逻辑在 notes.ts)
export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    content?: string;
    slug?: string;
    excerpt?: string;
    cover?: string;
    tags?: string[];
    isPublic?: number;
    pinned?: number;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const row = await updateNote(Number(id), { ...body, snapshot: true }, user);
  if (!row) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, note: row });
}

// 删除进回收站(软删除,数据还在,可还原)
export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const row = await softDeleteNote(Number(id), user);
  if (!row) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
