// 私有区读取层:站长登录后的所有"读内容"都从这里走。
// 与公开区的 content-api.ts 分成两个出口是有意的:
//   content-api 只出「公开+未删除」;这里站长全权(含未公开、回收站里的)。
// 二期 AI(RAG)挂在私有区这一侧——AI 要能读到你的全部笔记。
import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { attachments, noteTags, noteVersions, notes, tags } from "@/db/schema";

export type KbListItem = {
  id: number;
  type: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  isPublic: number;
  pinned: number;
  publishedAt: string | null;
  updatedAt: string;
  tags: string[];
};

async function attachTagsKb<T extends { id: number }>(
  rows: T[],
): Promise<(T & { tags: string[] })[]> {
  if (rows.length === 0) return [];
  const tagRows = await db
    .select({ noteId: noteTags.noteId, name: tags.name })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id));
  const byNote = new Map<number, string[]>();
  for (const row of tagRows) {
    const list = byNote.get(row.noteId) ?? [];
    list.push(row.name);
    byNote.set(row.noteId, list);
  }
  return rows.map((row) => ({ ...row, tags: byNote.get(row.id) ?? [] }));
}

/** 私有区笔记列表(站长写的 type='note'),按更新时间倒序 */
export async function listKbNotes(type = "note"): Promise<KbListItem[]> {
  const rows = await db
    .select({
      id: notes.id,
      type: notes.type,
      slug: notes.slug,
      title: notes.title,
      excerpt: notes.excerpt,
      content: notes.content,
      isPublic: notes.isPublic,
      pinned: notes.pinned,
      publishedAt: notes.publishedAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(and(eq(notes.type, type), isNull(notes.deletedAt)))
    .orderBy(desc(notes.updatedAt));
  return attachTagsKb(rows);
}

/** 回收站:全部被软删除的内容,不分类型 */
export async function listTrash(): Promise<KbListItem[]> {
  const rows = await db
    .select({
      id: notes.id,
      type: notes.type,
      slug: notes.slug,
      title: notes.title,
      excerpt: notes.excerpt,
      content: notes.content,
      isPublic: notes.isPublic,
      pinned: notes.pinned,
      publishedAt: notes.publishedAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(isNotNull(notes.deletedAt))
    .orderBy(desc(notes.updatedAt));
  return attachTagsKb(rows);
}

/** 单篇全文(含未公开),找不到返回 null */
export async function getKbNote(id: number) {
  const [note] = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  if (!note) return null;
  const tagRows = await db
    .select({ name: tags.name })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(eq(noteTags.noteId, id));
  return { ...note, tags: tagRows.map((t) => t.name) };
}

/** 仪表盘统计 */
export async function kbStats() {
  const [noteCount] = await db
    .select({ c: count() })
    .from(notes)
    .where(and(eq(notes.type, "note"), isNull(notes.deletedAt)));
  const [postCount] = await db
    .select({ c: count() })
    .from(notes)
    .where(and(eq(notes.type, "post"), isNull(notes.deletedAt)));
  const [attachmentCount] = await db.select({ c: count() }).from(attachments);
  const [trashCount] = await db
    .select({ c: count() })
    .from(notes)
    .where(isNotNull(notes.deletedAt));
  const [versionCount] = await db.select({ c: count() }).from(noteVersions);
  return {
    notes: noteCount.c,
    posts: postCount.c,
    attachments: attachmentCount.c,
    trash: trashCount.c,
    versions: versionCount.c,
  };
}

/** 导出用:全部未删除内容 + 各自标签 */
export async function listAllForExport() {
  const rows = await db
    .select()
    .from(notes)
    .where(isNull(notes.deletedAt))
    .orderBy(desc(notes.updatedAt));
  return attachTagsKb(rows);
}
