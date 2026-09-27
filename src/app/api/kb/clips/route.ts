import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { clipUrl } from "@/lib/clips";

// 网页剪藏:POST {url, tags?} → 抓取正文存为剪藏笔记
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    url?: string;
    tags?: string[];
  } | null;
  if (!body?.url) {
    return NextResponse.json({ error: "缺少 URL" }, { status: 400 });
  }
  try {
    const note = await clipUrl(body.url, user, body.tags ?? []);
    return NextResponse.json({ ok: true, note });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "剪藏失败" },
      { status: 400 },
    );
  }
}
