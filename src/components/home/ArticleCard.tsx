import Link from "next/link";

import { fallbackCover } from "@/lib/site-config";
import type { PostListItem } from "@/lib/content-api";

// 文章封面卡:标题压在封面图上(渐变压暗保证可读),日期/浏览量/标签在卡身
export default function ArticleCard({ post }: { post: PostListItem }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="glass group block overflow-hidden rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-44 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.cover || fallbackCover(post.slug)}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* 底部渐变压暗:标题压图的白字靠它保证可读 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <h3 className="absolute bottom-3 left-4 right-4 line-clamp-2 text-lg font-bold leading-snug text-white drop-shadow">
          {post.title}
        </h3>
      </div>
      <div className="p-4">
        {post.excerpt && (
          <p className="line-clamp-2 text-sm opacity-75">{post.excerpt}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs opacity-60">
          <span>
            📅 {post.publishedAt?.slice(0, 10)} · 👁 {post.views}
          </span>
          <span className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="rounded-full border border-border px-2 py-0.5">
                {tag}
              </span>
            ))}
          </span>
        </div>
      </div>
    </Link>
  );
}
