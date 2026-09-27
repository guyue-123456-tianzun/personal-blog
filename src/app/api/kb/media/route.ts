import { NextResponse } from "next/server";

import { getSessionUsername } from "@/lib/session";
import { createMedia } from "@/lib/media";

// 新增书影音记录
export async function POST(request: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    type?: string;
    title?: string;
    status?: string;
    rating?: number;
    comment?: string;
  } | null;
  if (!body?.type || !body?.title || !body?.status) {
    return NextResponse.json({ error: "类型/标题/状态不能为空" }, { status: 400 });
  }

  try {
    const row = await createMedia({
      type: body.type,
      title: body.title,
      status: body.status,
      rating: body.rating,
      comment: body.comment,
    });
    return NextResponse.json({ ok: true, item: row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建失败" },
      { status: 400 },
    );
  }
}
