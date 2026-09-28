import Link from "next/link";

import DiaryComposer from "@/components/kb/DiaryComposer";
import { listKbNotes } from "@/lib/kb-content";
import { getSessionUser } from "@/lib/session";

// 日记(B5):今天的日记 + 历史
export const dynamic = "force-dynamic";

export const metadata = { title: "日记" };

export default async function KbDiaryPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const entries = await listKbNotes("diary", sessionUser);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">日记</h1>
      <p className="mt-1 text-sm opacity-60">今天的日记写在这里,永不出现在公开区。</p>

      <div className="mt-6">
        <DiaryComposer />
      </div>

      {entries.length === 0 ? (
        <p className="mt-6 opacity-60">还没有日记。</p>
      ) : (
        <div className="mt-6 space-y-2">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/kb/notes/${entry.id}`}
              className="block rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{entry.title}</span>
                <span className="shrink-0 text-xs opacity-50">
                  {entry.updatedAt.slice(0, 10)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm opacity-70">
                {entry.excerpt ?? entry.content.slice(0, 80)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
