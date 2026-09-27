import { NextResponse } from "next/server";

import { getSessionUsername } from "@/lib/session";
import { createNote } from "@/lib/notes";

// 新建笔记。type 缺省为 'note'(私有笔记);博客文章是 'post',由发布流程传入
export async function POST(request: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    type?: string;
    title?: string;
    content?: string;
    slug?: string;
    excerpt?: string;
    cover?: string;
    tags?: string[];
    isPublic?: number;
    publishedAt?: string;
  } | null;
  if (!body?.title || body.content === undefined) {
    return NextResponse.json({ error: "标题和正文不能为空" }, { status: 400 });
  }

  try {
    const row = await createNote({
      type: body.type,
      title: body.title,
      content: body.content,
      slug: body.slug,
      excerpt: body.excerpt,
      cover: body.cover,
      tags: body.tags,
      isPublic: body.isPublic,
      publishedAt: body.publishedAt,
    });
    return NextResponse.json({ ok: true, note: row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建失败" },
      { status: 400 },
    );
  }
}
