import { NextResponse } from "next/server";

import { getSessionUsername } from "@/lib/session";
import { purgeNote } from "@/lib/notes";

// 彻底删除(不可还原):连带版本历史与标签关联一并清掉
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const row = await purgeNote(Number(id));
  if (!row) {
    return NextResponse.json({ error: "笔记不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
