import Link from "next/link";

import { getPublishedPosts, getTagCloud } from "@/lib/content-api";

// 文章数据在数据库中,实时读取而不是构建期固化
export const dynamic = "force-dynamic";

export default async function Home() {
  const [posts, tags] = await Promise.all([getPublishedPosts(), getTagCloud()]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">最新文章</h1>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.name}
              href={`/tags/${tag.name}`}
              className="rounded-full border border-border px-3 py-1 text-xs opacity-70 transition-opacity hover:opacity-100"
            >
              {tag.name} · {tag.count}
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="mt-10 opacity-60">还没有文章,发布第一篇后会显示在这里。</p>
      ) : (
        <div className="mt-6 space-y-4">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-baseline justify-between gap-4">
                <Link
                  href={`/posts/${post.slug}`}
                  className="text-lg font-semibold transition-colors hover:text-accent"
                >
                  {post.title}
                </Link>
                <time className="shrink-0 text-xs opacity-50">
                  {post.publishedAt?.slice(0, 10)}
                </time>
              </div>
              {post.excerpt && (
                <p className="mt-2 text-sm opacity-70">{post.excerpt}</p>
              )}
              {post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tags/${tag}`}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs opacity-70 transition-opacity hover:opacity-100"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
