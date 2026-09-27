import Link from "next/link";

import { fallbackCover } from "@/lib/site-config";
import { listMedia, statusLabel } from "@/lib/media";

// 书影音(C1):书/影/游 清单,带状态与评分
export const dynamic = "force-dynamic";

export const metadata = { title: "书影音" };

const TYPES = [
  { key: "", label: "全部" },
  { key: "book", label: "书" },
  { key: "movie", label: "影" },
  { key: "game", label: "游" },
];

type Props = { searchParams: Promise<{ type?: string }> };

export default async function MediaPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const active = ["book", "movie", "game"].includes(type ?? "") ? type : "";
  const items = await listMedia(active || undefined);

  function stars(rating: number | null) {
    if (rating === null) return "";
    const full = Math.round(rating / 2);
    return "★".repeat(full) + "☆".repeat(5 - full);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">书影音</h1>
      <p className="mt-2 text-sm opacity-60">读过的书、看过的片、玩过的游。</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TYPES.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key ? `/media?type=${tab.key}` : "/media"}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              active === tab.key
                ? "border-accent bg-accent text-white"
                : "border-border hover:bg-foreground/10"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="glass mt-8 rounded-2xl p-8 text-center text-sm opacity-60">
          这个分类下还没有记录。
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="glass flex gap-4 rounded-2xl p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.coverUrl || fallbackCover(item.title)}
                alt=""
                className="h-24 w-16 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate font-semibold">{item.title}</h3>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs opacity-60">
                    {statusLabel(item.type, item.status)}
                  </span>
                </div>
                {item.rating !== null && (
                  <p className="mt-1 text-sm text-amber-400">
                    {stars(item.rating)}
                    <span className="ml-1.5 opacity-60">{item.rating}/10</span>
                  </p>
                )}
                {item.comment && (
                  <p className="mt-1 line-clamp-2 text-sm opacity-70">{item.comment}</p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
