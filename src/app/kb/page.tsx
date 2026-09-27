import Link from "next/link";

import { listKbNotes, kbStats } from "@/lib/kb-content";
import { getSessionUsername } from "@/lib/session";

// 私有区仪表盘:数据概览 + 最近笔记 + 快捷入口
export const dynamic = "force-dynamic";

export default async function KbDashboard() {
  const [username, stats, recent] = await Promise.all([
    getSessionUsername(),
    kbStats(),
    listKbNotes(),
  ]);

  const cards = [
    { label: "私有笔记", value: stats.notes, href: "/kb/notes" },
    { label: "博客文章", value: stats.posts, href: "/" },
    { label: "附件", value: stats.attachments, href: "/kb/notes" },
    { label: "版本快照", value: stats.versions, href: "/kb/notes" },
    { label: "回收站", value: stats.trash, href: "/kb/trash" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold">你好,{username}</h1>
      <p className="mt-1 text-sm opacity-60">
        这里只有你能看到。写作、整理、回顾,都在这一区完成。
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
          >
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs opacity-60">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">最近笔记</h2>
        <Link href="/kb/notes/new" className="text-sm text-accent hover:underline">
          + 写新笔记
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="mt-3 opacity-60">还没有笔记。点右上角「写新笔记」记下第一条。</p>
      ) : (
        <div className="mt-3 space-y-2">
          {recent.slice(0, 5).map((note) => (
            <Link
              key={note.id}
              href={`/kb/notes/${note.id}`}
              className="flex items-baseline justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-shadow hover:shadow-sm"
            >
              <span className="font-medium">{note.title}</span>
              <span className="shrink-0 text-xs opacity-50">
                {note.updatedAt.slice(0, 16)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
