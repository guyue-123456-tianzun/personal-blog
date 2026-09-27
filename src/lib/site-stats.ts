// 站点数据统计卡的数据来源:文章数 / 标签数 / 总字数 / 运行天数 / 总浏览量
import { and, count, eq, isNull, sql, sum } from "drizzle-orm";

import { db } from "@/lib/db";
import { notes, postViews, tags } from "@/db/schema";
import { siteConfig } from "./site-config";

const publishedPost = and(
  eq(notes.type, "post"),
  eq(notes.isPublic, 1),
  isNull(notes.deletedAt),
);

export type SiteStats = {
  posts: number;
  tags: number;
  words: number;
  days: number;
  views: number;
};

export async function getSiteStats(): Promise<SiteStats> {
  const [postCount] = await db
    .select({ c: count() })
    .from(notes)
    .where(publishedPost);

  const [tagCount] = await db
    .select({ c: count() })
    .from(tags);

  const [wordSum] = await db
    .select({ w: sum(sql`length(${notes.content})`).mapWith(Number) })
    .from(notes)
    .where(publishedPost);

  const [viewSum] = await db
    .select({ v: sum(postViews.views).mapWith(Number) })
    .from(postViews);

  const days = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(siteConfig.siteStartDate).getTime()) / 86_400_000,
    ),
  );

  return {
    posts: postCount.c,
    tags: tagCount.c,
    words: wordSum.w ?? 0,
    days,
    views: viewSum.v ?? 0,
  };
}

/** 记一次浏览(文章详情页每次渲染调用;个人站点粗粒度足够) */
export async function recordPostView(slug: string) {
  await db
    .insert(postViews)
    .values({ slug, views: 1 })
    .onConflictDoUpdate({
      target: postViews.slug,
      set: { views: sql`${postViews.views} + 1` },
    });
}

export async function getPostViews(slug: string): Promise<number> {
  const [row] = await db
    .select({ views: postViews.views })
    .from(postViews)
    .where(eq(postViews.slug, slug))
    .limit(1);
  return row?.views ?? 0;
}
