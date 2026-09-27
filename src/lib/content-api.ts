// 公开区读取层:游客能看到的一切内容都从这里出(只出公开且未删除的)。
// 博客文章 = 站长的文章;说说流 = 全站注册用户的公开动态(社交层)。
// 私有区读取在 kb-content.ts,二期 AI(RAG)挂那一侧。
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  attachments,
  noteTags,
  notes,
  postViews,
  tags,
  users,
} from "@/db/schema";
import { escapeLike, makeSnippet } from "./search";
import { getAdminUser } from "./users";

export type PostListItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover: string | null;
  publishedAt: string | null;
  views: number;
  tags: string[];
};

/** 博客文章 = 站长发布的(isPublic=1,未删除);注册用户的公开内容走说说流 */
async function publishedPostFilter() {
  const admin = await getAdminUser();
  return admin
    ? and(
        eq(notes.type, "post"),
        eq(notes.isPublic, 1),
        isNull(notes.deletedAt),
        or(eq(notes.userId, admin.id), isNull(notes.userId)),
      )
    : and(
        eq(notes.type, "post"),
        eq(notes.isPublic, 1),
        isNull(notes.deletedAt),
        isNull(notes.userId),
      );
}

async function attachTags<T extends { id: number }>(
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

/** 首页文章列表:置顶优先,其余按发布时间倒序;带浏览量 */
export async function getPublishedPosts(): Promise<PostListItem[]> {
  const rows = await db
    .select({
      id: notes.id,
      slug: notes.slug,
      title: notes.title,
      excerpt: notes.excerpt,
      cover: notes.cover,
      publishedAt: notes.publishedAt,
      views: sql<number>`ifnull(${postViews.views}, 0)`.mapWith(Number),
    })
    .from(notes)
    .leftJoin(postViews, eq(notes.slug, postViews.slug))
    .where(await publishedPostFilter())
    .orderBy(desc(notes.pinned), desc(notes.publishedAt), desc(notes.createdAt));
  return attachTags(rows);
}

/** 文章详情:含正文全文与标签;不存在或未公开返回 null */
export async function getPostBySlug(slug: string) {
  const [post] = await db
    .select()
    .from(notes)
    .where(and(await publishedPostFilter(), eq(notes.slug, slug)))
    .limit(1);
  if (!post) return null;
  const tagRows = await db
    .select({ name: tags.name })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(eq(noteTags.noteId, post.id));
  return { ...post, tags: tagRows.map((t) => t.name) };
}

/** 标签云:各标签下的公开文章数 */
export async function getTagCloud(): Promise<{ name: string; count: number }[]> {
  return db
    .select({ name: tags.name, count: sql<number>`count(*)` })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .innerJoin(notes, eq(noteTags.noteId, notes.id))
    .where(await publishedPostFilter())
    .groupBy(tags.name)
    .orderBy(desc(sql`count(*)`));
}

/** 某个标签下的公开文章 */
export async function getPostsByTag(tagName: string): Promise<PostListItem[]> {
  const rows = await db
    .select({
      id: notes.id,
      slug: notes.slug,
      title: notes.title,
      excerpt: notes.excerpt,
      cover: notes.cover,
      publishedAt: notes.publishedAt,
      views: sql<number>`ifnull(${postViews.views}, 0)`.mapWith(Number),
    })
    .from(notes)
    .leftJoin(postViews, eq(notes.slug, postViews.slug))
    .innerJoin(noteTags, eq(notes.id, noteTags.noteId))
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(and(await publishedPostFilter(), eq(tags.name, tagName)))
    .orderBy(desc(notes.publishedAt));
  return attachTags(rows);
}

/** 公开搜索:只搜公开文章,返回命中摘要(私有区搜索在 kb 侧,互不相通) */
export async function searchPublishedPosts(
  query: string,
  limit = 30,
): Promise<{ slug: string; title: string; snippet: string; publishedAt: string | null }[]> {
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${escapeLike(q)}%`;
  const rows = await db
    .select({
      slug: notes.slug,
      title: notes.title,
      content: notes.content,
      publishedAt: notes.publishedAt,
    })
    .from(notes)
    .where(
      and(
        await publishedPostFilter(),
        sql`(${notes.title} LIKE ${pattern} ESCAPE '\\' OR ${notes.content} LIKE ${pattern} ESCAPE '\\')`,
      ),
    )
    .orderBy(desc(notes.publishedAt))
    .limit(limit);
  return rows.map(({ content, ...rest }) => ({
    ...rest,
    snippet: makeSnippet(content, q),
  }));
}

/** 归档:按年分组的公开文章 */
export async function getArchives(): Promise<
  { year: string; posts: { slug: string; title: string; date: string }[] }[]
> {
  const rows = await db
    .select({ slug: notes.slug, title: notes.title, publishedAt: notes.publishedAt })
    .from(notes)
    .where(await publishedPostFilter())
    .orderBy(desc(notes.publishedAt));
  const byYear = new Map<string, { slug: string; title: string; date: string }[]>();
  for (const row of rows) {
    const date = (row.publishedAt ?? "").slice(0, 10);
    const year = date.slice(0, 4) || "未知";
    const list = byYear.get(year) ?? [];
    list.push({ slug: row.slug, title: row.title, date });
    byYear.set(year, list);
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, posts]) => ({ year, posts }));
}

// ===== 说说流(B4)与照片墙(C6)的公开读取(全站用户) =====

export type MomentItem = {
  id: number;
  content: string;
  createdAt: string;
  tags: string[];
  images: { id: number; url: string }[];
  author: {
    id: number;
    username: string;
    nickname: string | null;
    avatarUrl: string | null;
  };
};

/** 公开说说流:全站用户的公开动态,按时间倒序,带作者与配图。
 *  authorUsername 传入时只看某个用户(个人主页用) */
export async function listPublicMoments(
  limit = 10,
  offset = 0,
  authorUsername?: string,
): Promise<MomentItem[]> {
  const authorFilter = authorUsername
    ? eq(users.username, authorUsername)
    : undefined;
  const rows = await db
    .select({
      id: notes.id,
      content: notes.content,
      createdAt: notes.createdAt,
      userId: notes.userId,
      authorUsername: users.username,
      authorNickname: users.nickname,
      authorAvatar: users.avatarUrl,
    })
    .from(notes)
    .innerJoin(users, eq(notes.userId, users.id))
    .where(
      and(
        eq(notes.type, "moment"),
        eq(notes.isPublic, 1),
        isNull(notes.deletedAt),
        authorFilter,
      ),
    )
    .orderBy(desc(notes.createdAt))
    .limit(limit)
    .offset(offset);
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const tagRows = await db
    .select({ noteId: noteTags.noteId, name: tags.name })
    .from(noteTags)
    .innerJoin(tags, eq(noteTags.tagId, tags.id))
    .where(inArray(noteTags.noteId, ids));
  const imageRows = await db
    .select({ id: attachments.id, noteId: attachments.noteId })
    .from(attachments)
    .where(
      and(
        inArray(attachments.noteId, ids),
        eq(attachments.isPublic, 1),
        sql`${attachments.mime} like 'image/%'`,
      ),
    );

  const tagsBy = new Map<number, string[]>();
  for (const row of tagRows) {
    const list = tagsBy.get(row.noteId) ?? [];
    list.push(row.name);
    tagsBy.set(row.noteId, list);
  }
  const imagesBy = new Map<number, { id: number; url: string }[]>();
  for (const row of imageRows) {
    if (row.noteId === null) continue;
    const list = imagesBy.get(row.noteId) ?? [];
    list.push({ id: row.id, url: `/api/kb/attachments/${row.id}` });
    imagesBy.set(row.noteId, list);
  }

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    tags: tagsBy.get(row.id) ?? [],
    images: imagesBy.get(row.id) ?? [],
    author: {
      id: row.userId ?? 0,
      username: row.authorUsername,
      nickname: row.authorNickname ?? row.authorUsername,
      avatarUrl: row.authorAvatar,
    },
  }));
}

/** 照片墙:全部公开图片附件 */
export async function listPublicImages(
  limit = 120,
): Promise<{ id: number; filename: string; createdAt: string }[]> {
  return db
    .select({
      id: attachments.id,
      filename: attachments.filename,
      createdAt: attachments.createdAt,
    })
    .from(attachments)
    .where(
      and(eq(attachments.isPublic, 1), sql`${attachments.mime} like 'image/%'`),
    )
    .orderBy(desc(attachments.id))
    .limit(limit);
}
