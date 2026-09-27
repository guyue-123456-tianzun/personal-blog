import { NextResponse } from "next/server";

import { getSessionUsername } from "@/lib/session";
import { rollbackToVersion } from "@/lib/notes";

// 回滚到某个历史版本:当前内容会先被存档,所以回滚本身也是可撤销的
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    versionId?: number;
  } | null;
  if (!body?.versionId) {
    return NextResponse.json({ error: "缺少 versionId" }, { status: 400 });
  }

  const row = await rollbackToVersion(Number(id), Number(body.versionId));
  if (!row) {
    return NextResponse.json({ error: "笔记或版本不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
