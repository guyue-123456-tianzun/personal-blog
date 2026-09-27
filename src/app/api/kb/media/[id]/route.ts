import { NextResponse } from "next/server";

import { getSessionUsername } from "@/lib/session";
import { deleteMedia, updateMedia } from "@/lib/media";

type Params = { params: Promise<{ id: string }> };

// 更新书影音记录
export async function PATCH(request: Request, { params }: Params) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    type?: string;
    title?: string;
    status?: string;
    rating?: number;
    comment?: string;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  try {
    const row = await updateMedia(Number(id), body);
    if (!row) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item: row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新失败" },
      { status: 400 },
    );
  }
}

// 删除书影音记录
export async function DELETE(_request: Request, { params }: Params) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const row = await deleteMedia(Number(id));
  if (!row) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
