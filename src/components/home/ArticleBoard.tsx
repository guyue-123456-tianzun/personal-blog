"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { PostListItem } from "@/lib/content-api";
import { fallbackCover } from "@/lib/site-config";
import {
  readThemePrefs,
  saveThemePrefs,
  THEME_PREFS_EVENT,
} from "@/lib/theme-prefs";

type Props = {
  posts: PostListItem[];
  tags: { name: string; count: number }[];
};

// 封面比例循环变化:瀑布流之所以"错落",靠的就是卡片高度不一样,
// 全用同一个比例就退化成整齐网格了
const COVER_RATIOS = [
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-[16/10]",
  "aspect-square",
];

// 文章区:瀑布流(多列纵向排布,卡片高度错落)+ 列表两种浏览方式。
// 访客的选择存浏览器(与主题面板联动)
export default function ArticleBoard({ posts, tags }: Props) {
  const [mode, setMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const sync = () => setMode(readThemePrefs().articleMode);
    sync();
    window.addEventListener(THEME_PREFS_EVENT, sync);
    return () => window.removeEventListener(THEME_PREFS_EVENT, sync);
  }, []);

  function switchMode(next: "grid" | "list") {
    setMode(next);
    saveThemePrefs({ articleMode: next });
  }

  return (
    <div className="glass rounded-2xl p-5">
      {/* 头部:标题 + 浏览方式切换 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          最新文章
          <span className="ml-2 text-xs font-normal opacity-50">共 {posts.length} 篇</span>
        </h2>
        <div className="flex items-center gap-1 rounded-full border border-border p-1 text-xs">
          <button
            onClick={() => switchMode("grid")}
            aria-label="瀑布流视图"
            className={`rounded-full px-2.5 py-1 transition-colors ${
              mode === "grid" ? "bg-accent text-white" : "opacity-60 hover:opacity-100"
            }`}
          >
            ▦ 瀑布
          </button>
          <button
            onClick={() => switchMode("list")}
            aria-label="列表视图"
            className={`rounded-full px-2.5 py-1 transition-colors ${
              mode === "list" ? "bg-accent text-white" : "opacity-60 hover:opacity-100"
            }`}
          >
            ☰ 列表
          </button>
        </div>
      </div>

      {/* 分类标签胶囊 */}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 8).map((tag) => (
            <Link
              key={tag.name}
              href={`/tags/${tag.name}`}
              className="rounded-full border border-border px-2.5 py-1 text-xs transition-colors hover:bg-foreground/10"
            >
              {tag.name} · {tag.count}
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="mt-4 text-sm opacity-60">
          还没有文章。站长登录后写一篇,发布到这里。
        </p>
      ) : mode === "grid" ? (
        /* 瀑布流:两列纵向排布,卡片高度各不相同(参考站那样错落下来) */
        <div className="mt-4 columns-1 gap-4 sm:columns-2">
          {posts.map((post, index) => (
            <WaterfallCard key={post.slug} post={post} index={index} />
          ))}
        </div>
      ) : (
        /* 列表模式:紧凑行 */
        <div className="mt-4 space-y-1">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-foreground/5"
            >
              <span className="truncate font-medium">{post.title}</span>
              <span className="shrink-0 text-xs opacity-50">
                {post.publishedAt?.slice(0, 10)} · 👁 {post.views}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// 瀑布流卡片:封面压标题 + 摘要,高度按 index 循环取不同比例。
// break-inside-avoid 是分列布局的关键——不然一张卡会被拦腰切到下一列
function WaterfallCard({ post, index }: { post: PostListItem; index: number }) {
  const ratio = COVER_RATIOS[index % COVER_RATIOS.length];
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group mb-4 block break-inside-avoid overflow-hidden rounded-xl border border-border/60 transition-shadow hover:shadow-md"
    >
      <div className={`relative overflow-hidden ${ratio}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.cover || fallbackCover(post.slug)}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <h3 className="absolute bottom-3 left-3.5 right-3.5 line-clamp-2 text-base font-bold text-white drop-shadow">
          {post.title}
        </h3>
      </div>
      <div className="p-3.5">
        {post.excerpt && (
          <p className="line-clamp-2 text-sm opacity-70">{post.excerpt}</p>
        )}
        <div className="mt-2.5 flex items-center justify-between text-xs opacity-55">
          <span>📅 {post.publishedAt?.slice(0, 10)} · 👁 {post.views}</span>
          <span>{post.tags[0] ?? ""}</span>
        </div>
      </div>
    </Link>
  );
}
