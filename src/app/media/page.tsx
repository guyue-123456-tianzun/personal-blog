import Link from "next/link";

import { fallbackCover } from "@/lib/site-config";
import { listMedia, mediaTypeLabel, statusLabel } from "@/lib/media";
import { getSessionUser } from "@/lib/session";
import { PublicShell } from "@/components/public/PublicShell";
import MediaQuickAdd from "@/components/public/MediaQuickAdd";

// 书影音·番组计划(C1):全站记录,封面卡网格 + 状态筛选 + 评分角标
export const dynamic = "force-dynamic";

export const metadata = { title: "书影音" };

const TYPES = ["", "book", "movie", "anime", "music", "game"];
const STATUS = ["", "wish", "doing", "done"];

type Props = { searchParams: Promise<{ type?: string; status?: string }> };

export default async function MediaPage({ searchParams }: Props) {
  const { type, status } = await searchParams;
  const activeType = TYPES.includes(type ?? "") ? (type ?? "") : "";
  const activeStatus = STATUS.includes(status ?? "") ? (status ?? "") : "";

  const viewer = await getSessionUser();
  let items = await listMedia(activeType || undefined);
  if (activeStatus) {
    items = items.filter((item) => item.status === activeStatus);
  }

  return (
    <PublicShell>
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2.5">
          <span className="inline-block h-5 w-1 rounded-full bg-accent" />
          <h1 className="text-lg font-bold">番组计划</h1>
        </div>
        <p className="mt-1 text-sm opacity-60">记录读过的书、看过的片、玩过的游。</p>

        {viewer?.role === "admin" && <MediaQuickAdd />}

        {/* 类型页签 */}
        <div className="mt-4 flex flex-wrap gap-2">
          {TYPES.map((key) => {
            const label = key === "" ? "全部" : mediaTypeLabel(key);
            const active = activeType === key;
            return (
              <Link
                key={key || "all"}
                href={key ? `/media?type=${key}` : "/media"}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-accent bg-accent text-white"
                    : "border-border hover:bg-foreground/10"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* 状态筛选 */}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {STATUS.map((key) => {
            const label = key === "" ? "全部状态" : statusLabel(activeType || "movie", key);
            return (
              <Link
                key={key || "all-status"}
                href={`/media?${new URLSearchParams({ ...(activeType ? { type: activeType } : {}), ...(key ? { status: key } : {}) }).toString()}`}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  activeStatus === key
                    ? "border-accent bg-accent text-white"
                    : "border-border hover:bg-foreground/10"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* 卡片网格 */}
        {items.length === 0 ? (
          <p className="mt-6 text-sm opacity-60">这个分类下还没有记录。</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="group relative overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.coverUrl || fallbackCover(item.title)}
                  alt=""
                  className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* 状态徽章 */}
                <span className="absolute left-2 top-2 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {statusLabel(item.type, item.status)}
                </span>
                {/* 评分角标 */}
                {item.rating !== null && (
                  <span className="absolute right-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                    ★ {item.rating}
                  </span>
                )}
                <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                  <p className="truncate text-sm font-bold drop-shadow">{item.title}</p>
                  <p className="truncate text-[10px] opacity-80">{mediaTypeLabel(item.type)}</p>
                </div>
                {item.comment && (
                  <p className="mt-1.5 line-clamp-2 text-xs opacity-70">{item.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
