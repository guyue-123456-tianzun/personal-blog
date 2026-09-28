// 书影音记录(C1)读写:想读/在看/看完 + 评分 + 短评。
// 多用户归属:每个用户管理自己的记录;校验集中在 createMedia/updateMedia。
import { and, desc, eq, isNull, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { mediaItems } from "@/db/schema";
import { getAdminUser, isOwner, type SiteUser } from "@/lib/users";

export type MediaItem = typeof mediaItems.$inferSelect;
export type MediaInput = {
  type: string;
  title: string;
  status: string;
  rating?: number | null;
  comment?: string | null;
  coverUrl?: string | null;
};

export const MEDIA_TYPES = [
  { key: "book", label: "书籍" },
  { key: "movie", label: "影视" },
  { key: "anime", label: "动漫" },
  { key: "music", label: "音乐" },
  { key: "game", label: "游戏" },
] as const;

export function statusLabel(type: string, status: string): string {
  const table: Record<string, Record<string, string>> = {
    book: { wish: "想读", doing: "在读", done: "读完" },
    movie: { wish: "想看", doing: "在看", done: "看过" },
    anime: { wish: "想看", doing: "在看", done: "看完" },
    music: { wish: "想听", doing: "在听", done: "听过" },
    game: { wish: "想玩", doing: "在玩", done: "玩过" },
  };
  return table[type]?.[status] ?? status;
}

export function mediaTypeLabel(type: string): string {
  return MEDIA_TYPES.find((t) => t.key === type)?.label ?? type;
}

function validate(input: MediaInput) {
  if (!["book", "movie", "game"].includes(input.type)) {
    throw new Error("类型必须是 书/影/游 之一");
  }
  if (!["wish", "doing", "done"].includes(input.status)) {
    throw new Error("状态不合法");
  }
  if (!input.title.trim()) throw new Error("标题不能为空");
  if (input.rating !== undefined && input.rating !== null) {
    const rating = Math.round(input.rating);
    if (rating < 0 || rating > 10) throw new Error("评分要在 0~10 之间");
  }
}

/** 公共书影音页:只展示站长的记录(与"公开博客文章 = 站长的"口径一致)。
 *  以前是全表返回,等于把注册用户的私人书影音清单也摆到了公开页上 */
export async function listMedia(type?: string): Promise<MediaItem[]> {
  const admin = await getAdminUser();
  const ownerFilter = admin
    ? or(eq(mediaItems.userId, admin.id), isNull(mediaItems.userId))
    : isNull(mediaItems.userId);
  const rows = type
    ? await db
        .select()
        .from(mediaItems)
        .where(and(eq(mediaItems.type, type), ownerFilter))
        .orderBy(desc(mediaItems.updatedAt))
    : await db
        .select()
        .from(mediaItems)
        .where(ownerFilter)
        .orderBy(desc(mediaItems.updatedAt));
  return rows;
}

/** 我自己的书影音(KB 后台) */
export async function listMyMedia(
  type: string | undefined,
  user: SiteUser,
): Promise<MediaItem[]> {
  const rows = await db
    .select()
    .from(mediaItems)
    .orderBy(desc(mediaItems.updatedAt));
  const mine = rows.filter((row) => isOwner(row.userId, user));
  return type ? mine.filter((row) => row.type === type) : mine;
}

export async function createMedia(
  input: MediaInput,
  userId: number | null,
): Promise<MediaItem> {
  validate(input);
  const [row] = await db
    .insert(mediaItems)
    .values({
      type: input.type,
      title: input.title.trim().slice(0, 100),
      status: input.status,
      rating: input.rating ?? null,
      comment: input.comment?.slice(0, 300) ?? null,
      coverUrl: input.coverUrl ?? null,
      userId,
    })
    .returning();
  return row;
}

function canManage(rowUserId: number | null, user: SiteUser) {
  return isOwner(rowUserId, user);
}

export async function updateMedia(
  id: number,
  input: Partial<MediaInput>,
  user: SiteUser,
): Promise<MediaItem | null> {
  const [existing] = await db
    .select()
    .from(mediaItems)
    .where(eq(mediaItems.id, id))
    .limit(1);
  if (!existing || !canManage(existing.userId, user)) return null;

  const merged = { ...existing, ...input } as MediaInput;
  validate(merged);
  const [row] = await db
    .update(mediaItems)
    .set({
      type: merged.type,
      title: merged.title.trim().slice(0, 100),
      status: merged.status,
      rating: merged.rating ?? null,
      comment: merged.comment?.slice(0, 300) ?? null,
      updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
    })
    .where(eq(mediaItems.id, id))
    .returning();
  return row ?? null;
}

export async function deleteMedia(id: number, user: SiteUser) {
  const [existing] = await db
    .select()
    .from(mediaItems)
    .where(eq(mediaItems.id, id))
    .limit(1);
  if (!existing || !canManage(existing.userId, user)) return null;
  const [row] = await db
    .delete(mediaItems)
    .where(eq(mediaItems.id, id))
    .returning();
  return row ?? null;
}
