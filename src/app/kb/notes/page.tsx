import Link from "next/link";

import { listKbNotes } from "@/lib/kb-content";
import { searchNotes } from "@/lib/search";
import { getSessionUser } from "@/lib/session";

// 笔记列表 + 全文搜索。搜索走 URL 参数(?q=),这样刷新/分享链接都保留搜索词
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function KbNotesPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const [notes, hits] = await Promise.all([
    listKbNotes("note", sessionUser),
    query ? searchNotes(query) : Promise.resolve([]),
  ]);
  const searching = query.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{searching ? "搜索结果" : "全部笔记"}</h1>
        <Link
          href="/kb/notes/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          + 写新笔记
        </Link>
      </div>

      {/* GET 表单:提交后带 ?q= 回到本页,服务端渲染结果 */}
      <form action="/kb/notes" method="get" className="mt-4 flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="搜标题或正文,比如:部署"
          className="w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg border border-border bg-card px-4 py-2 text-sm transition-opacity hover:opacity-80"
        >
          搜索
        </button>
        {searching && (
          <Link
            href="/kb/notes"
            className="shrink-0 self-center text-sm text-accent hover:underline"
          >
            清除
          </Link>
        )}
      </form>

      {searching ? (
        hits.length === 0 ? (
          <p className="mt-6 opacity-60">没有匹配「{query}」的内容。</p>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-sm opacity-60">命中 {hits.length} 条</p>
            {hits.map((hit) => (
              <Link
                key={hit.id}
                href={hit.type === "post" ? `/posts/${hit.slug}` : `/kb/notes/${hit.id}`}
                className="block rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{hit.title}</span>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs opacity-60">
                    {hit.type === "post" ? "博客文章" : hit.type}
                  </span>
                </div>
                <p className="mt-1 text-sm opacity-70">{hit.snippet}</p>
              </Link>
            ))}
          </div>
        )
      ) : notes.length === 0 ? (
        <p className="mt-6 opacity-60">还没有笔记,点右上角写下第一条。</p>
      ) : (
        <div className="mt-6 space-y-2">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/kb/notes/${note.id}`}
              className="block rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium">{note.title}</span>
                <span className="shrink-0 text-xs opacity-50">
                  更新于 {note.updatedAt.slice(0, 16)}
                </span>
              </div>
              {note.excerpt && (
                <p className="mt-1 text-sm opacity-70">{note.excerpt}</p>
              )}
              {note.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {note.tags.map((tag) => (
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
