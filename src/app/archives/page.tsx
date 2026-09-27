import Link from "next/link";

import { getArchives } from "@/lib/content-api";

export const dynamic = "force-dynamic";

export const metadata = { title: "归档" };

export default async function ArchivesPage() {
  const archives = await getArchives();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">归档</h1>

      {archives.length === 0 ? (
        <p className="mt-10 opacity-60">还没有文章。</p>
      ) : (
        <div className="mt-6 space-y-8">
          {archives.map((group) => (
            <section key={group.year}>
              <h2 className="text-xl font-semibold">{group.year} 年</h2>
              <div className="mt-3 space-y-2">
                {group.posts.map((post) => (
                  <div
                    key={post.slug}
                    className="flex items-baseline justify-between gap-4 border-b border-border pb-2"
                  >
                    <Link
                      href={`/posts/${post.slug}`}
                      className="font-medium transition-colors hover:text-accent"
                    >
                      {post.title}
                    </Link>
                    <time className="shrink-0 text-xs opacity-50">{post.date}</time>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
