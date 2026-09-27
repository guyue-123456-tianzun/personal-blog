import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { restoreNote } from "@/lib/notes";

// 从回收站还原
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const row = await restoreNote(Number(id), user);
  if (!row) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
