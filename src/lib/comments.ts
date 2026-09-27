// 评论系统:公开区访客可留言;站长可在后台隐藏/删除。
// 校验与限流都在写入口(addComment)这一处,页面和 API 只做转发。
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { comments, notes } from "@/db/schema";

const AUTHOR_MAX = 20;
const CONTENT_MAX = 500;
const RATE_LIMIT = 5; // 每 60 秒最多 5 条
const RATE_WINDOW_MS = 60_000;

// 内存限流表:重启即清零。个人博客量级下够用,上线后如有需要再换持久化
const recentComments = new Map<string, number[]>();

export type PublicComment = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
};

function checkRateLimit(key: string) {
  const now = Date.now();
  const list = (recentComments.get(key) ?? []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  if (list.length >= RATE_LIMIT) {
    throw new Error("评论太频繁了,休息一分钟再来吧");
  }
  list.push(now);
  recentComments.set(key, list);
}

async function ensurePublicPost(postSlug: string) {
  const [post] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(
      and(
        eq(notes.slug, postSlug),
        eq(notes.type, "post"),
        eq(notes.isPublic, 1),
      ),
    )
    .limit(1);
  if (!post) throw new Error("文章不存在或未发布");
}

export async function addComment(
  clientKey: string,
  postSlug: string,
  input: { author: string; content: string },
): Promise<PublicComment> {
  const author = input.author.trim().slice(0, AUTHOR_MAX);
  const content = input.content.trim().slice(0, CONTENT_MAX);
  if (!author) throw new Error("昵称不能为空");
  if (!content) throw new Error("评论内容不能为空");
  checkRateLimit(clientKey);
  await ensurePublicPost(postSlug);

  const [row] = await db
    .insert(comments)
    .values({ postSlug, author, content })
    .returning();
  return { id: row.id, author: row.author, content: row.content, createdAt: row.createdAt };
}

export async function listComments(postSlug: string): Promise<PublicComment[]> {
  const rows = await db
    .select({
      id: comments.id,
      author: comments.author,
      content: comments.content,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .where(and(eq(comments.postSlug, postSlug), eq(comments.isVisible, 1)))
    .orderBy(asc(comments.id))
    .limit(200);
  return rows;
}

export async function hideComment(id: number) {
  const [row] = await db
    .update(comments)
    .set({ isVisible: 0 })
    .where(eq(comments.id, id))
    .returning();
  return row ?? null;
}

export async function deleteComment(id: number) {
  const [row] = await db
    .delete(comments)
    .where(eq(comments.id, id))
    .returning();
  return row ?? null;
}
