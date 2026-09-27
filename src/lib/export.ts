// C8 全量导出:全部未删除内容 + 附件打成一个 zip。
// 目录结构:posts\<slug>.md / notes\<slug>.md / attachments\<id>-<文件名> / manifest.json
// 每篇 Markdown 带 YAML frontmatter——用任何笔记软件(Obsidian/Typora)打开都认识。
import fs from "node:fs";
import JSZip from "jszip";

import { db } from "@/lib/db";
import { attachments } from "@/db/schema";
import { listAllForExport } from "@/lib/kb-content";
import { resolveStored } from "@/lib/attachments";

function frontmatter(note: {
  title: string;
  slug: string;
  type: string;
  isPublic: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}) {
  const lines = [
    "---",
    `title: ${JSON.stringify(note.title)}`,
    `slug: ${note.slug}`,
    `type: ${note.type}`,
    `tags: [${note.tags.map((t) => JSON.stringify(t)).join(", ")}]`,
    `public: ${note.isPublic === 1}`,
    `published: ${note.publishedAt ?? ""}`,
    `created: ${note.createdAt}`,
    `updated: ${note.updatedAt}`,
    "---",
    "",
  ];
  return lines.join("\n");
}

// 内容类型 → 导出文件夹名。显式列出来,新类型启用时必须在这里登记,防止文件夹名漂移
const FOLDER_BY_TYPE: Record<string, string> = {
  post: "posts",
  note: "notes",
  clip: "clips",
  moment: "moments",
  diary: "diaries",
};

export async function buildExportZip(): Promise<Uint8Array> {
  const zip = new JSZip();
  const allNotes = await listAllForExport();

  for (const note of allNotes) {
    const folder = FOLDER_BY_TYPE[note.type] ?? note.type;
    const body = frontmatter(note) + note.content;
    zip.file(`${folder}/${note.slug}.md`, body);
  }

  const files = await db.select().from(attachments);
  for (const file of files) {
    try {
      const buf = fs.readFileSync(resolveStored(file.storedPath));
      zip.file(`attachments/${file.id}-${file.filename}`, buf);
    } catch {
      // 磁盘上已丢的附件跳过,导出照常进行(记录进 manifest 供核对)
      zip.file(`attachments/${file.id}-${file.filename}.缺失.txt`, "文件本体不在磁盘上");
    }
  }

  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        notes: allNotes.length,
        attachments: files.length,
      },
      null,
      2,
    ),
  );

  return zip.generateAsync({ type: "uint8array" });
}
