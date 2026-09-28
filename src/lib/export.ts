// C8 全量导出:全部未删除内容 + 附件打成一个 zip。
// 目录结构:posts\<slug>.md / notes\<slug>.md / attachments\<id>-<文件名> / manifest.json
// 每篇 Markdown 带 YAML frontmatter——用任何笔记软件(Obsidian/Typora)打开都认识。
import fs from "node:fs";
import JSZip from "jszip";

import { db } from "@/lib/db";
import { attachments } from "@/db/schema";
import { listAllForExport } from "@/lib/kb-content";
import { resolveStored } from "@/lib/attachments";
import { exportFolderFor } from "@/lib/content-types";
import { isOwner, type SiteUser } from "@/lib/users";

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

// 内容类型 → 导出文件夹名 的映射已挪到 src/lib/content-types.ts,
// 和 notes 的类型白名单共用一份登记,避免两处各写一半

// 导出该用户自己的全部内容(多用户:各导各的)
export async function buildExportZip(user: SiteUser): Promise<Uint8Array> {
  const zip = new JSZip();
  const allNotes = await listAllForExport(user);

  for (const note of allNotes) {
    const folder = exportFolderFor(note.type);
    const body = frontmatter(note) + note.content;
    zip.file(`${folder}/${note.slug}.md`, body);
  }

  // 附件同样只导自己的。以前是全表导出,等于把别的用户的私有附件一起打包了
  const exportedIds = new Set(allNotes.map((note) => note.id));
  const files = (await db.select().from(attachments)).filter(
    (file) =>
      isOwner(file.userId, user) &&
      (file.noteId === null || exportedIds.has(file.noteId)),
  );
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
