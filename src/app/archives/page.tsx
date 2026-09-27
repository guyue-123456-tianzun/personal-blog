import Link from "next/link";

import { getArchives } from "@/lib/content-api";
import PublicShell from "@/components/public/PublicShell";

export const dynamic = "force-dynamic";

export const metadata = { title: "归档" };

// 归档 = 时间线:左侧一条轴线,每个节点一篇文章(参考站的时间线样式)
export default async function ArchivesPage() {
  const archives = await getArchives();

  return (
    <PublicShell>
      <h1 className="text-2xl font-bold">归档</h1>

      {archives.length === 0 ? (
        <p className="mt-10 opacity-60">还没有文章。</p>
      ) : (
        <div className="mt-8 space-y-10">
          {archives.map((group) => (
            <section key={group.year}>
              <h2 className="text-xl font-semibold">
                {group.year} 年
                <span className="ml-2 text-sm opacity-50">{group.posts.length} 篇</span>
              </h2>
              <div className="relative ml-3 mt-4 space-y-5 border-l-2 border-border pl-7">
                {group.posts.map((post) => (
                  <div key={post.slug} className="relative">
                    <span className="absolute -left-[2.1rem] top-1.5 h-3 w-3 rounded-full border-2 border-[var(--background)] bg-accent" />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <Link
                        href={`/posts/${post.slug}`}
                        className="font-medium transition-colors hover:text-accent"
                      >
                        {post.title}
                      </Link>
                      <time className="text-xs opacity-50">{post.date}</time>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PublicShell>
  );
}
