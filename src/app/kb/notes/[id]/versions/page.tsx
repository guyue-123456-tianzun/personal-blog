import Link from "next/link";
import { notFound } from "next/navigation";

import RollbackButton from "@/components/kb/RollbackButton";
import { Markdown } from "@/components/Markdown";
import { getKbNote } from "@/lib/kb-content";
import { getVersion, listVersions } from "@/lib/notes";

// 历史版本(C7):列表 + 点开看某一份 + 回滚。保留最近 20 份
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
};

export default async function VersionsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { v } = await searchParams;
  const note = await getKbNote(Number(id));
  if (!note) notFound();

  const versions = await listVersions(note.id);
  const selected = v ? await getVersion(Number(v)) : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">「{note.title}」的历史版本</h1>
        <Link href={`/kb/notes/${note.id}`} className="text-sm text-accent hover:underline">
          ← 返回编辑
        </Link>
      </div>
      <p className="mt-1 text-sm opacity-60">
        共 {versions.length} 份快照(只保留最近 20 份)。回滚前,当前内容会先自动存一份,所以回滚可以撤销。
      </p>

      {versions.length === 0 ? (
        <p className="mt-6 opacity-60">还没有历史版本——保存过一次之后再改动,就会产生快照。</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {versions.map((version) => (
            <li
              key={version.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="text-sm">
                <span className="opacity-50">存档于 {version.savedAt.slice(0, 16)}</span>
                <span className="ml-3 font-medium">{version.title}</span>
              </span>
              <span className="flex items-center gap-4">
                <Link
                  href={`/kb/notes/${note.id}/versions?v=${version.id}`}
                  className="text-sm opacity-70 hover:opacity-100"
                >
                  查看
                </Link>
                {selected?.id === version.id && (
                  <RollbackButton noteId={note.id} versionId={version.id} />
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            版本 #{selected.id}(存档于 {selected.savedAt.slice(0, 16)})
          </h2>
          <div className="mt-3 rounded-xl border border-border bg-card p-5">
            <Markdown content={selected.content} />
          </div>
        </section>
      )}
    </main>
  );
}
