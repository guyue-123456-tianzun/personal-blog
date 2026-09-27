// 私有区写入层:新建/更新(带版本快照)/软删除/恢复/彻底删除/回滚。
// 读写分离:这里只管"写",页面取数走 kb-content.ts。
import { desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { attachments, noteTags, noteVersions, notes, tags } from "@/db/schema";

// C7 版本历史:每篇只保留最近 20 份快照,更老的自动清理
const VERSIONS_TO_KEEP = 20;

const now = sql`(datetime('now'))`;

export type NoteInput = {
  type?: string;
  title: string;
  content: string;
  slug?: string;
  excerpt?: string | null;
  tags?: string[];
  isPublic?: number;
  pinned?: number;
  publishedAt?: string | null;
};

/** slug 规范化:只留字母数字中文与连字符;重名自动加 -2 -3;excludeId 用于编辑时排除自己 */
async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  const cleaned =
    base
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `n-${Date.now()}`;
  let candidate = cleaned;
  for (let i = 2; ; i++) {
    const hit = await db
      .select({ id: notes.id })
      .from(notes)
      .where(
        excludeId
          ? sql`${notes.slug} = ${candidate} and ${notes.id} != ${excludeId}`
          : eq(notes.slug, candidate),
      )
      .limit(1);
    if (hit.length === 0) return candidate;
    candidate = `${cleaned}-${i}`;
  }
}

/** 把标签数组同步到 note_tags(先清后插,多出来的空标签直接忽略) */
async function syncTags(noteId: number, names: string[]) {
  await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
  for (const name of names.map((n) => n.trim()).filter(Boolean)) {
    const [tag] = await db
      .insert(tags)
      .values({ name })
      .onConflictDoUpdate({ target: tags.name, set: { name } })
      .returning();
    await db
      .insert(noteTags)
      .values({ noteId, tagId: tag.id })
      .onConflictDoNothing();
  }
}

/** C7:保存前把当前版本拍快照;超出保留数的自动清理 */
async function snapshotVersion(noteId: number) {
  const [current] = await db
    .select({ title: notes.title, content: notes.content })
    .from(notes)
    .where(eq(notes.id, noteId))
    .limit(1);
  if (!current) return;
  await db
    .insert(noteVersions)
    .values({ noteId, title: current.title, content: current.content });
  const keep = await db
    .select({ id: noteVersions.id })
    .from(noteVersions)
    .where(eq(noteVersions.noteId, noteId))
    .orderBy(desc(noteVersions.id))
    .limit(VERSIONS_TO_KEEP);
  const stale = (await db
    .select({ id: noteVersions.id })
    .from(noteVersions)
    .where(eq(noteVersions.noteId, noteId)))
    .map((r) => r.id)
    .filter((id) => !keep.some((k) => k.id === id));
  if (stale.length > 0) {
    await db.delete(noteVersions).where(inArray(noteVersions.id, stale));
  }
}

export async function createNote(input: NoteInput) {
  const slug = await uniqueSlug(input.slug || input.title);
  const [row] = await db
    .insert(notes)
    .values({
      type: input.type ?? "note",
      slug,
      title: input.title,
      content: input.content,
      excerpt: input.excerpt ?? null,
      isPublic: input.isPublic ?? 0,
      pinned: input.pinned ?? 0,
      publishedAt: input.publishedAt ?? null,
    })
    .returning();
  if (input.tags?.length) await syncTags(row.id, input.tags);
  return row;
}

export async function updateNote(
  id: number,
  input: Partial<NoteInput> & { snapshot?: boolean },
) {
  // C7 约定:任何一次保存都会先把改动前的版本存档
  if (input.snapshot) await snapshotVersion(id);

  let patchSlug: string | undefined;
  if (input.slug) {
    patchSlug = await uniqueSlug(input.slug, id);
  }

  const [row] = await db
    .update(notes)
    .set({
      updatedAt: now,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.content !== undefined ? { content: input.content } : {}),
      ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
      ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
      ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
      ...(input.publishedAt !== undefined
        ? { publishedAt: input.publishedAt }
        : {}),
      ...(patchSlug ? { slug: patchSlug } : {}),
    })
    .where(eq(notes.id, id))
    .returning();
  if (!row) return null;
  if (input.tags) await syncTags(id, input.tags);
  return row;
}

/** 软删除 = 进回收站(数据还在) */
export async function softDeleteNote(id: number) {
  const [row] = await db
    .update(notes)
    .set({ deletedAt: now })
    .where(eq(notes.id, id))
    .returning();
  return row ?? null;
}

/** 从回收站还原 */
export async function restoreNote(id: number) {
  const [row] = await db
    .update(notes)
    .set({ deletedAt: null })
    .where(eq(notes.id, id))
    .returning();
  return row ?? null;
}

/** 彻底删除:连带版本历史与标签关联一并清掉;附件解绑(文件本体保留在磁盘,记录置空) */
export async function purgeNote(id: number) {
  await db.delete(noteVersions).where(eq(noteVersions.noteId, id));
  await db.delete(noteTags).where(eq(noteTags.noteId, id));
  await db.update(attachments).set({ noteId: null }).where(eq(attachments.noteId, id));
  const [row] = await db.delete(notes).where(eq(notes.id, id)).returning();
  return row ?? null;
}

/** 回滚到某个历史版本:先把当前内容存档,再写回旧版(回滚本身也可撤销) */
export async function rollbackToVersion(noteId: number, versionId: number) {
  const [version] = await db
    .select()
    .from(noteVersions)
    .where(eq(noteVersions.id, versionId))
    .limit(1);
  if (!version || version.noteId !== noteId) return null;
  return updateNote(noteId, {
    title: version.title,
    content: version.content,
    snapshot: true,
  });
}

export async function listVersions(noteId: number) {
  return db
    .select({
      id: noteVersions.id,
      title: noteVersions.title,
      savedAt: noteVersions.savedAt,
    })
    .from(noteVersions)
    .where(eq(noteVersions.noteId, noteId))
    .orderBy(desc(noteVersions.id));
}

export async function getVersion(versionId: number) {
  const [row] = await db
    .select()
    .from(noteVersions)
    .where(eq(noteVersions.id, versionId))
    .limit(1);
  return row ?? null;
}
