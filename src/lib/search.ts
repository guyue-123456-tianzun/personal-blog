// 全文搜索(一期):SQLite LIKE 实现,够用几千条笔记的量级。
// 搜索逻辑全部集中在这一处——二期换 FTS5 / Meilisearch 时只改这个文件,页面不动。
import { and, desc, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { notes } from "@/db/schema";

export type SearchHit = {
  id: number;
  type: string;
  slug: string;
  title: string;
  snippet: string;
  updatedAt: string;
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

export async function searchNotes(query: string, limit = 50): Promise<SearchHit[]> {
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
      and(
        isNull(notes.deletedAt),
        sql`(${notes.title} LIKE ${pattern} ESCAPE '\\' OR ${notes.content} LIKE ${pattern} ESCAPE '\\')`,
      ),
    )
    .orderBy(desc(notes.updatedAt))
    .limit(limit);
  return rows.map(({ content, ...rest }) => ({
    ...rest,
    snippet: makeSnippet(content, q),
  }));
}
