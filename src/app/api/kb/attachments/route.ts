import { NextResponse } from "next/server";

import { getSessionUsername } from "@/lib/session";
import { saveUpload } from "@/lib/attachments";

// 上传附件:multipart/form-data,字段 file(必填) + noteId(可空=散件)
export async function POST(request: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "不是合法的表单上传" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少 file 字段" }, { status: 400 });
  }
  const noteIdRaw = form.get("noteId");
  const noteId = noteIdRaw ? Number(noteIdRaw) : null;

  try {
    const row = await saveUpload(file, noteId);
    return NextResponse.json({ ok: true, attachment: row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败" },
      { status: 400 },
    );
  }
}
