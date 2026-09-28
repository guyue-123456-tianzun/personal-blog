import Link from "next/link";

import { searchPublishedPosts } from "@/lib/search";

// 公开搜索结果页:Hero 搜索框和这里的表单都指向 ?q=
export const dynamic = "force-dynamic";

export const metadata = { title: "搜索" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchPublishedPosts(query) : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">搜索</h1>
      <form action="/search" method="get" className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="搜索公开文章…"
          className="glass w-full rounded-full bg-transparent px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          搜索
        </button>
      </form>

      {query && (
        <p className="mt-6 text-sm opacity-60">
          「{query}」命中 {results.length} 条
        </p>
      )}
      {query && results.length === 0 && (
        <p className="mt-2 opacity-60">换个关键词试试?</p>
      )}
      <div className="mt-4 space-y-3">
        {results.map((hit) => (
          <Link
            key={hit.slug}
            href={`/posts/${hit.slug}`}
            className="glass block rounded-2xl p-4 transition-shadow hover:shadow-lg"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{hit.title}</span>
              <time className="shrink-0 text-xs opacity-50">
                {hit.publishedAt?.slice(0, 10)}
              </time>
            </div>
            <p className="mt-1 text-sm opacity-70">{hit.snippet}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
