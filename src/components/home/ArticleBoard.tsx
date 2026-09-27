"use client";

import Link from "next/link";
import { useState } from "react";

import { fallbackCover } from "@/lib/site-config";
import type { PostListItem } from "@/lib/content-api";

type Props = {
  posts: PostListItem[];
  tags: { name: string; count: number }[];
};

// 文章区:参考站同款"列表/网格"切换;第一篇做大卡(视觉锚点),其余两列网格
export default function ArticleBoard({ posts, tags }: Props) {
  const [mode, setMode] = useState<"grid" | "list">("grid");
  const [featured, ...rest] = posts;

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
            onClick={() => setMode("grid")}
            aria-label="网格视图"
            className={`rounded-full px-2.5 py-1 transition-colors ${
              mode === "grid" ? "bg-accent text-white" : "opacity-60 hover:opacity-100"
            }`}
          >
            ▦ 网格
          </button>
          <button
            onClick={() => setMode("list")}
            aria-label="列表视图"
            className={`rounded-full px-2.5 py-1 transition-colors ${
              mode === "list" ? "bg-accent text-white" : "opacity-60 hover:opacity-100"
            }`}
          >
            ☰ 列表
          </button>
        </div>
      </div>

      {/* 分类标签胶囊:点一下筛选对应文章?——M4b 再接筛选,现在纯展示 */}
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
        <div className="mt-4 space-y-4">
          {/* 第一篇:大卡,压图标题 */}
          <Link
            href={`/posts/${featured.slug}`}
            className="group relative block h-56 overflow-hidden rounded-xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.cover || fallbackCover(featured.slug)}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h3 className="text-xl font-bold drop-shadow">{featured.title}</h3>
              <p className="mt-1 text-xs opacity-80">
                📅 {featured.publishedAt?.slice(0, 10)} · 👁 {featured.views}
                {featured.tags.length > 0 && ` · ${featured.tags.join(" / ")}`}
              </p>
            </div>
          </Link>
          <div className="grid gap-4 sm:grid-cols-2">
            {rest.map((post) => (
              <ArticleGridCard key={post.slug} post={post} />
            ))}
          </div>
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

function ArticleGridCard({ post }: { post: PostListItem }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block overflow-hidden rounded-xl"
    >
      <div className="relative h-36 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.cover || fallbackCover(post.slug)}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <h3 className="absolute bottom-2.5 left-3.5 right-3.5 line-clamp-1 text-base font-bold text-white drop-shadow">
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
