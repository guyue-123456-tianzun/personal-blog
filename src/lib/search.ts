// 全文搜索(一期):SQLite LIKE 实现,够用几千条笔记的量级。
// 搜索逻辑全部集中在这一处——二期换 FTS5 / Meilisearch 时只改这个文件,页面不动。
//
// 这里只负责"关键词怎么匹配",不负责"哪些内容能看见":
// 公开搜索复用 content-api 的已发布过滤,私有搜索复用 kb-content 的归属过滤,
// 两个出口仍是内容可见性的唯一定义处,搜索不绕过它们。
import { and, desc, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { notes } from "@/db/schema";
import { publishedPostFilter } from "@/lib/content-api";
import { kbOwnerFilter } from "@/lib/kb-content";
import type { SiteUser } from "@/lib/users";

export type SearchHit = {
  id: number;
  type: string;
  slug: string;
  title: string;
  snippet: string;
  updatedAt: string;
};

export type PostSearchHit = {
  slug: string;
  title: string;
  snippet: string;
  publishedAt: string | null;
};

// LIKE 的通配符 % 和 _ 要转义,不然搜"100%"会变成搜"100任意字符"
export function escapeLike(query: string) {
  return query.replace(/[\\%_]/g, (ch) => "\\" + ch);
}

// 命中摘要:定位关键词位置,截取前后各约 40 字;没命中正文(即命中标题)就取开头
export function makeSnippet(content: string, query: string) {
  const idx = content.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return content.slice(0, 80);
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + query.length + 40);
  return (start > 0 ? "…" : "") + content.slice(start, end) + (end < content.length ? "…" : "");
}

/** LIKE 匹配条件:标题或正文命中 */
function matchPattern(pattern: string) {
  return sql`(${notes.title} LIKE ${pattern} ESCAPE '\\' OR ${notes.content} LIKE ${pattern} ESCAPE '\\')`;
}

/**
 * 私有区搜索:只搜当前用户自己的内容(站长额外包含 userId 为空的早期内容)。
 * 归属过滤与回收站过滤都在 SQL 里完成——注册用户之间互相搜不到对方的东西。
 */
export async function searchNotes(
  query: string,
  user: SiteUser,
  limit = 50,
): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${escapeLike(q)}%`;
  const rows = await db
    .select({
      id: notes.id,
      type: notes.type,
      slug: notes.slug,
      title: notes.title,
      content: notes.content,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(
      and(kbOwnerFilter(user), isNull(notes.deletedAt), matchPattern(pattern)),
    )
    .orderBy(desc(notes.updatedAt))
    .limit(limit);
  return rows.map(({ content, ...rest }) => ({
    ...rest,
    snippet: makeSnippet(content, q),
  }));
}

/** 公开区搜索:只搜已发布且未删除的公开文章(可见性判定复用 content-api 的过滤) */
export async function searchPublishedPosts(
  query: string,
  limit = 30,
): Promise<PostSearchHit[]> {
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
    .where(and(await publishedPostFilter(), matchPattern(pattern)))
    .orderBy(desc(notes.publishedAt))
    .limit(limit);
  return rows.map(({ content, ...rest }) => ({
    ...rest,
    snippet: makeSnippet(content, q),
  }));
}
