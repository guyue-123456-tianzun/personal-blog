import fs from "node:fs";
import { NextResponse } from "next/server";

import {
  contentDispositionFor,
  deleteAttachment,
  getAttachment,
  resolveStored,
} from "@/lib/attachments";
import { getSessionUsername } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// 取附件内容:图片/PDF 直接预览,其他类型触发下载。
// 附件挂在登录之后(不进公开静态目录)——因为附件可能属于私有笔记
export async function GET(_request: Request, { params }: Params) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const row = await getAttachment(Number(id));
  if (!row) {
    return NextResponse.json({ error: "附件不存在" }, { status: 404 });
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
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const row = await deleteAttachment(Number(id));
  if (!row) {
    return NextResponse.json({ error: "附件不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
