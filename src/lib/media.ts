// 书影音记录(C1)读写:想读/在看/看完 + 评分 + 短评。
// 校验集中在 createMedia/updateMedia,页面与 API 只做转发。
import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { mediaItems } from "@/db/schema";

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
  { key: "book", label: "书" },
  { key: "movie", label: "影" },
  { key: "game", label: "游" },
] as const;

export function statusLabel(type: string, status: string): string {
  const table: Record<string, Record<string, string>> = {
    book: { wish: "想读", doing: "在读", done: "读完" },
    movie: { wish: "想看", doing: "在看", done: "看过" },
    game: { wish: "想玩", doing: "在玩", done: "玩过" },
  };
  return table[type]?.[status] ?? status;
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

export async function listMedia(type?: string): Promise<MediaItem[]> {
  const query = db.select().from(mediaItems);
  const rows = type
    ? await query.where(eq(mediaItems.type, type)).orderBy(desc(mediaItems.updatedAt))
    : await query.orderBy(desc(mediaItems.updatedAt));
  return rows;
}

export async function createMedia(input: MediaInput): Promise<MediaItem> {
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
    })
    .returning();
  return row;
}

export async function updateMedia(
  id: number,
  input: Partial<MediaInput>,
): Promise<MediaItem | null> {
  const merged = { ...(await getMedia(id) ?? {}), ...input } as MediaInput;
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

export async function deleteMedia(id: number) {
  const [row] = await db
    .delete(mediaItems)
    .where(eq(mediaItems.id, id))
    .returning();
  return row ?? null;
}

async function getMedia(id: number): Promise<MediaItem | null> {
  const [row] = await db
    .select()
    .from(mediaItems)
    .where(eq(mediaItems.id, id))
    .limit(1);
  return row ?? null;
}
