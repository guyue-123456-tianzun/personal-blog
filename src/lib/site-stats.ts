// 站点数据统计卡的数据来源:文章数 / 标签数 / 总字数 / 运行天数 / 浏览量(总 + 今日)
import { count, eq, sql, sum } from "drizzle-orm";

import { db } from "@/lib/db";
import { notes, postViews, siteViews, tags } from "@/db/schema";
import { publishedPostFilter } from "./content-api";
import { siteConfig } from "./site-config";

export type SiteStats = {
  posts: number;
  tags: number;
  words: number;
  days: number;
  views: number;
  today: number;
  online: number;
};

export async function getSiteStats(): Promise<SiteStats> {
  // 统计口径与公开博客列表保持一致:走公开区出口的过滤,不自己拼 isPublic 条件
  const publishedPost = await publishedPostFilter();

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

  const today = new Date().toISOString().slice(0, 10);
  const [todayRow] = await db
    .select({ views: siteViews.views })
    .from(siteViews)
    .where(eq(siteViews.date, today))
    .limit(1);

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
    today: todayRow?.views ?? 0,
    online: getOnlineCount(),
  };
}

// ===== 在线访客(心跳版) =====
// 页面每 45 秒向后端报一次到,5 分钟内报过到的算"在线"。
// 单实例内存实现:重启清零、不跨服务器——对个人站点是诚实且够用的口径。
const onlineMap = new Map<string, number>();
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function recordHeartbeat(clientKey: string) {
  onlineMap.set(clientKey, Date.now());
}

export function getOnlineCount(): number {
  const cutoff = Date.now() - ONLINE_WINDOW_MS;
  let online = 0;
  for (const [key, lastSeen] of onlineMap) {
    if (lastSeen >= cutoff) online++;
    else onlineMap.delete(key);
  }
  return online;
}

/** 站点每日浏览:首页每次渲染记一次(个人站点,粗粒度足够) */
export async function recordSiteVisit() {
  const today = new Date().toISOString().slice(0, 10);
  await db
    .insert(siteViews)
    .values({ date: today, views: 1 })
    .onConflictDoUpdate({
      target: siteViews.date,
      set: { views: sql`${siteViews.views} + 1` },
    });
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
