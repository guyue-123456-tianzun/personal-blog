import { NextResponse } from "next/server";

import { addComment } from "@/lib/comments";

// 访客提交评论。限流/校验/归属校验都在 addComment 内部。
// clientKey 取代理头里的 IP(本地直连时是空),同 IP 每分钟最多 5 条
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    slug?: string;
    author?: string;
    content?: string;
  } | null;
  if (!body?.slug || !body?.author || !body?.content) {
    return NextResponse.json({ error: "昵称和评论内容不能为空" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  try {
    const comment = await addComment(ip, body.slug, {
      author: body.author,
      content: body.content,
    });
    return NextResponse.json({ ok: true, comment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "提交失败" },
      { status: 400 },
    );
  }
}
