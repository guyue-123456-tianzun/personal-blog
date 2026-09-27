// 附件存储:文件本体写进 data\uploads\<年>\<月>\随机名,数据库只记元信息。
// 通过环境变量 BLOG_DATA_DIR 可把 data 目录整体改指到别处(测试用),默认 <项目根>\data\。
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { attachments } from "@/db/schema";

// 类型白名单:宁缺毋滥。svg 不放行(可携带脚本),可执行文件一律拒绝
export const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/zip",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

function dataDir(): string {
  return process.env.BLOG_DATA_DIR
    ? path.resolve(process.env.BLOG_DATA_DIR)
    : path.join(process.cwd(), "data");
}

/** 把表里的相对路径解析成磁盘绝对路径;强制限制在 data 目录内,防路径穿越 */
export function resolveStored(storedPath: string): string {
  const full = path.resolve(dataDir(), storedPath);
  if (!full.startsWith(path.resolve(dataDir()))) {
    throw new Error("非法的附件路径");
  }
  return full;
}

export function extensionFor(mime: string, originalName: string): string {
  const fromName = path.extname(originalName).toLowerCase();
  if (fromName && fromName.length <= 10) return fromName;
  const table: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "text/markdown": ".md",
    "application/zip": ".zip",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
  };
  return table[mime] ?? "";
}

export async function saveUpload(
  file: File,
  noteId: number | null,
  isPublic = 0,
) {
  if (file.size <= 0) throw new Error("空文件");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("文件超过 20MB 上限");
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`不支持的文件类型:${file.type || "未知"}`);
  }

  const ext = extensionFor(file.type, file.name);
  const nowOnDisk = new Date();
  const rel =
    `uploads/${nowOnDisk.getFullYear()}/${String(nowOnDisk.getMonth() + 1).padStart(2, "0")}/` +
    crypto.randomBytes(8).toString("hex") +
    ext;
  const full = resolveStored(rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, Buffer.from(await file.arrayBuffer()));

  const [row] = await db
    .insert(attachments)
    .values({
      noteId,
      filename: file.name,
      storedPath: rel,
      mime: file.type,
      size: file.size,
      isPublic,
    })
    .returning();
  return row;
}

export async function listByNote(noteId: number) {
  return db
    .select()
    .from(attachments)
    .where(eq(attachments.noteId, noteId))
    .orderBy(desc(attachments.id));
}

export async function getAttachment(id: number) {
  const [row] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, id))
    .limit(1);
  return row ?? null;
}

export async function deleteAttachment(id: number) {
  const row = await getAttachment(id);
  if (!row) return null;
  try {
    fs.unlinkSync(resolveStored(row.storedPath));
  } catch {
    // 文件已不在磁盘上不算错误,照样把记录清掉
  }
  await db.delete(attachments).where(eq(attachments.id, id));
  return row;
}

/** 告诉浏览器怎么展示:图片和 PDF 直接打开,其他一律下载 */
export function contentDispositionFor(mime: string, filename: string) {
  const inline = mime.startsWith("image/") || mime === "application/pdf";
  return `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
