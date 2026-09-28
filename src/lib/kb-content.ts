// 私有区读取层:登录用户的所有"读内容"都从这里走。
// 每个用户只能看到自己的内容(含回收站);null userId 的历史内容归站长。
// 与公开区的 content-api.ts 分成两个出口是隐私设计的一部分。
import { and, count, desc, eq, gte, isNotNull, isNull, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { attachments, noteTags, noteVersions, notes, tags } from "@/db/schema";
import { isOwner, type SiteUser } from "@/lib/users";

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

/** 归属过滤:普通用户只看自己的;站长额外看到 null(历史内容)。
 *  导出给 search.ts 复用,保证"我的内容"的定义只有这一处 */
export function kbOwnerFilter(user: SiteUser) {
  return user.role === "admin"
    ? or(eq(notes.userId, user.id), isNull(notes.userId))
    : eq(notes.userId, user.id);
}

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

/** 私有区笔记列表(指定类型),按更新时间倒序 */
export async function listKbNotes(
  type: string,
  user: SiteUser,
): Promise<KbListItem[]> {
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
    .where(and(eq(notes.type, type), isNull(notes.deletedAt), kbOwnerFilter(user)))
    .orderBy(desc(notes.updatedAt));
  return attachTagsKb(rows);
}

/** 回收站:当前用户被软删除的内容 */
export async function listTrash(user: SiteUser): Promise<KbListItem[]> {
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
    .where(and(isNotNull(notes.deletedAt), kbOwnerFilter(user)))
    .orderBy(desc(notes.updatedAt));
  return attachTagsKb(rows);
}

/** 单篇全文(仅限本人),找不到或不是自己的返回 null */
export async function getKbNote(id: number, user: SiteUser) {
  const [note] = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
  if (!note) return null;
  if (!isOwner(note.userId, user)) return null;
  const tagRows = await db
    .select({ name: tags.name })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(eq(noteTags.noteId, id));
  return { ...note, tags: tagRows.map((t) => t.name) };
}

/** 仪表盘统计(按用户) */
export async function kbStats(user: SiteUser) {
  const owner = kbOwnerFilter(user);
  const [noteCount] = await db
    .select({ c: count() })
    .from(notes)
    .where(and(eq(notes.type, "note"), isNull(notes.deletedAt), owner));
  const [postCount] = await db
    .select({ c: count() })
    .from(notes)
    .where(and(eq(notes.type, "post"), isNull(notes.deletedAt), owner));
  const [attachmentCount] = await db
    .select({ c: count() })
    .from(attachments)
    .innerJoin(notes, eq(attachments.noteId, notes.id))
    .where(kbOwnerFilter(user));
  const [trashCount] = await db
    .select({ c: count() })
    .from(notes)
    .where(and(isNotNull(notes.deletedAt), kbOwnerFilter(user)));
  const [versionCount] = await db
    .select({ c: count() })
    .from(noteVersions)
    .innerJoin(notes, eq(noteVersions.noteId, notes.id))
    .where(kbOwnerFilter(user));
  return {
    notes: noteCount.c,
    posts: postCount.c,
    attachments: attachmentCount.c,
    trash: trashCount.c,
    versions: versionCount.c,
  };
}

/** 导出用:该用户的全部未删除内容 + 各自标签 */
export async function listAllForExport(user: SiteUser) {
  const rows = await db
    .select()
    .from(notes)
    .where(and(isNull(notes.deletedAt), kbOwnerFilter(user)))
    .orderBy(desc(notes.updatedAt));
  return attachTagsKb(rows);
}

/** 该用户全部未删除内容的基础字段(知识图谱这类要跨类型扫正文的场景用) */
export async function listOwnNoteBasics(user: SiteUser) {
  return db
    .select({
      id: notes.id,
      title: notes.title,
      type: notes.type,
      content: notes.content,
    })
    .from(notes)
    .where(and(isNull(notes.deletedAt), kbOwnerFilter(user)));
}

/** 该用户某时间点之后新建的内容(周报汇总用) */
export async function listOwnNotesSince(user: SiteUser, sinceIso: string) {
  return db
    .select({
      id: notes.id,
      type: notes.type,
      title: notes.title,
      content: notes.content,
      createdAt: notes.createdAt,
    })
    .from(notes)
    .where(
      and(
        kbOwnerFilter(user),
        isNull(notes.deletedAt),
        gte(notes.createdAt, sinceIso),
      ),
    )
    .orderBy(desc(notes.createdAt));
}

/** 该用户指定类型的全部 slug(周报统计"我收到的评论"用,不分是否公开) */
export async function listOwnSlugsByType(user: SiteUser, type: string) {
  return db
    .select({ slug: notes.slug })
    .from(notes)
    .where(and(kbOwnerFilter(user), eq(notes.type, type)));
}
