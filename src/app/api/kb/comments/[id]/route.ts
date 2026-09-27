import { NextResponse } from "next/server";

import { getSessionUsername } from "@/lib/session";
import { deleteComment, hideComment } from "@/lib/comments";

type Params = { params: Promise<{ id: string }> };

// 站长管理评论:DELETE ?mode=hide 隐藏(默认),彻底删除加 ?mode=purge
export async function DELETE(request: Request, { params }: Params) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const mode = new URL(request.url).searchParams.get("mode") ?? "hide";
  const row =
    mode === "purge" ? await deleteComment(Number(id)) : await hideComment(Number(id));
  if (!row) {
    return NextResponse.json({ error: "评论不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
