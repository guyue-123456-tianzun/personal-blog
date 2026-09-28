import Link from "next/link";

import ClipForm from "@/components/kb/ClipForm";
import { listKbNotes } from "@/lib/kb-content";
import { getSessionUser } from "@/lib/session";

// 网页剪藏(B2):粘贴 URL 抓正文,列在下方
export const dynamic = "force-dynamic";

export const metadata = { title: "网页剪藏" };

export default async function KbClipsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const clips = await listKbNotes("clip", sessionUser);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">网页剪藏</h1>
      <p className="mt-1 text-sm opacity-60">
        看到好文章直接存下来,自动抓正文,只存在你自己的知识库里。
      </p>

      <div className="mt-6">
        <ClipForm />
      </div>

      {clips.length === 0 ? (
        <p className="mt-6 opacity-60">还没有剪藏,上面粘贴一个网址试试。</p>
      ) : (
        <div className="mt-6 space-y-2">
          {clips.map((clip) => (
            <Link
              key={clip.id}
              href={`/kb/notes/${clip.id}`}
              className="block rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{clip.title}</span>
                <span className="shrink-0 text-xs opacity-50">
                  {clip.updatedAt.slice(0, 10)}
                </span>
              </div>
              {clip.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {clip.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border px-2 py-0.5 text-xs opacity-60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
