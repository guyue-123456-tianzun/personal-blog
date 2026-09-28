import fs from "node:fs";
import { NextResponse } from "next/server";

import {
  canManageAttachment,
  contentDispositionFor,
  deleteAttachment,
  getAttachment,
  resolveStored,
} from "@/lib/attachments";
import { getSessionUser } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// 取附件内容:图片/PDF 直接预览,其他类型触发下载。
// 两道判定——
//   公开附件(is_public=1):谁都能读。照片墙、说说配图、站点背景图、头像、点歌台的歌都靠它;
//   私有附件:必须登录,且只能是自己的(没有归属人的老数据按站长所有)。
// 注意:这个地址在 middleware 里被显式放行(见 src/middleware.ts),所以校验要在这里做全。
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const row = await getAttachment(Number(id));
  if (!row) {
    return NextResponse.json({ error: "附件不存在" }, { status: 404 });
  }
  if (!row.isPublic) {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (!canManageAttachment(row, user)) {
      return NextResponse.json({ error: "无权访问该附件" }, { status: 403 });
    }
  }
  let bytes: Buffer;
  try {
    bytes = fs.readFileSync(resolveStored(row.storedPath));
  } catch {
    return NextResponse.json({ error: "文件本体已丢失" }, { status: 410 });
  }
  return new Response(new Blob([new Uint8Array(bytes)]), {
    headers: {
      "Content-Type": row.mime,
      "Content-Disposition": contentDispositionFor(row.mime, row.filename),
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await getAttachment(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "附件不存在" }, { status: 404 });
  }
  // 只有主人能删。这条例外以前漏了,登录用户能删掉别人的附件
  if (!canManageAttachment(existing, user)) {
    return NextResponse.json({ error: "无权删除该附件" }, { status: 403 });
  }
  await deleteAttachment(Number(id));
  return NextResponse.json({ ok: true });
}
