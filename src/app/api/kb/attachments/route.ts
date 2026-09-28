import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { saveUpload } from "@/lib/attachments";

// 上传附件:multipart/form-data,字段 file(必填) + noteId(可空=散件)
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
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
  // public=1 表示公开资源(站点背景图/头像等),访客无需登录即可访问;默认私有
  const isPublic = form.get("public") === "1" ? 1 : 0;

  try {
    const row = await saveUpload(file, noteId, isPublic, user.id);
    return NextResponse.json({ ok: true, attachment: row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传失败" },
      { status: 400 },
    );
  }
}
