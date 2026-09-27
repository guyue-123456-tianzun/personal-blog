import Link from "next/link";

import { getPostsByTag } from "@/lib/content-api";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ tag: string }> };

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const posts = await getPostsByTag(decodeURIComponent(tag));

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">标签「{decodeURIComponent(tag)}」</h1>
      <p className="mt-2 text-sm opacity-60">共 {posts.length} 篇文章</p>

      {posts.length === 0 ? (
        <p className="mt-10 opacity-60">这个标签下还没有文章。</p>
      ) : (
        <div className="mt-6 space-y-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-baseline justify-between gap-4">
                <Link
                  href={`/posts/${post.slug}`}
                  className="font-medium transition-colors hover:text-accent"
                >
                  {post.title}
                </Link>
                <time className="shrink-0 text-xs opacity-50">
                  {post.publishedAt?.slice(0, 10)}
                </time>
              </div>
            </article>
          ))}
        </div>
      )}
      <Link href="/" className="mt-8 inline-block text-sm text-accent hover:underline">
        ← 返回首页
      </Link>
    </main>
  );
}
