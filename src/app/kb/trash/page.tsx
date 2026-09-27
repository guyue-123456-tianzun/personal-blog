import Link from "next/link";

import TrashActions from "@/components/kb/TrashActions";
import { listTrash } from "@/lib/kb-content";

// 回收站:软删除的内容在这里,可还原或彻底删除
export const dynamic = "force-dynamic";

export const metadata = { title: "回收站" };

export default async function TrashPage() {
  const items = await listTrash();

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold">回收站</h1>
      <p className="mt-1 text-sm opacity-60">
        删除的笔记先到这里,数据仍然完整;只有「彻底删除」才会真正清掉。
      </p>

      {items.length === 0 ? (
        <p className="mt-6 opacity-60">回收站是空的。</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="min-w-0">
                <span className="font-medium">{item.title}</span>
                <span className="ml-3 rounded-full border border-border px-2 py-0.5 text-xs opacity-60">
                  {item.type === "post" ? "博客文章" : item.type}
                </span>
                <span className="ml-3 text-xs opacity-50">
                  删除于 {item.updatedAt.slice(0, 16)}
                </span>
              </span>
              <TrashActions id={item.id} title={item.title} />
            </li>
          ))}
        </ul>
      )}
      <Link href="/kb" className="mt-8 inline-block text-sm text-accent hover:underline">
        ← 回仪表盘
      </Link>
    </main>
  );
}
