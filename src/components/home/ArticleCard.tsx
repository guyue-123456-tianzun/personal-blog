import Link from "next/link";

import { fallbackCover } from "@/lib/site-config";
import type { PostListItem } from "@/lib/content-api";

// 文章封面卡:有封面用封面,没封面按 slug 稳定分配一张渐变占位图
export default function ArticleCard({ post }: { post: PostListItem }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="glass group block overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.cover || fallbackCover(post.slug)}
        alt=""
        className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-semibold transition-colors group-hover:text-accent">
            {post.title}
          </h3>
          <time className="shrink-0 text-xs opacity-50">
            {post.publishedAt?.slice(0, 10)}
          </time>
        </div>
        {post.excerpt && (
          <p className="mt-1.5 line-clamp-2 text-sm opacity-70">{post.excerpt}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2 py-0.5 text-xs opacity-60"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="shrink-0 text-xs opacity-50">👁 {post.views}</span>
        </div>
      </div>
    </Link>
  );
}
