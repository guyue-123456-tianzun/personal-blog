import Link from "next/link";

import { listPublicMoments } from "@/lib/content-api";

// 说说流(B4):公开的短动态,带配图与标签;私密说说不出现在这里
export const dynamic = "force-dynamic";

export const metadata = { title: "说说" };

const PAGE_SIZE = 10;

type Props = { searchParams: Promise<{ page?: string }> };

export default async function MomentsPage({ searchParams }: Props) {
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const moments = await listPublicMoments(PAGE_SIZE, (pageNum - 1) * PAGE_SIZE);
  const hasMore = moments.length === PAGE_SIZE;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">说说</h1>
      <p className="mt-2 text-sm opacity-60">碎碎念、配图、心情,记录此刻。</p>

      {moments.length === 0 ? (
        <p className="glass mt-8 rounded-2xl p-8 text-center text-sm opacity-60">
          还没有公开的说说。
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {moments.map((moment) => (
            <article key={moment.id} className="glass rounded-2xl p-5">
              <p className="whitespace-pre-wrap text-[15px] leading-7">
                {moment.content}
              </p>
              {moment.images.length > 0 && (
                <div
                  className={`mt-3 grid gap-2 ${
                    moment.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                  }`}
                >
                  {moment.images.map((image) => (
                    <a key={image.id} href={image.url} target="_blank">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt=""
                        className="h-44 w-full rounded-xl object-cover transition-transform duration-300 hover:scale-[1.02]"
                      />
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs opacity-50">
                <time>{moment.createdAt.slice(0, 16)}</time>
                <span className="flex gap-1.5">
                  {moment.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-border px-2 py-0.5">
                      #{tag}
                    </span>
                  ))}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 翻页 */}
      <div className="mt-6 flex justify-center gap-4 text-sm">
        {pageNum > 1 && (
          <Link href={`/moments?page=${pageNum - 1}`} className="text-accent hover:underline">
            ← 上一页
          </Link>
        )}
        {hasMore && (
          <Link href={`/moments?page=${pageNum + 1}`} className="text-accent hover:underline">
            下一页 →
          </Link>
        )}
      </div>
    </main>
  );
}
