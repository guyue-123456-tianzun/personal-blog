import Link from "next/link";
import { notFound } from "next/navigation";

import AttachmentsPanel from "@/components/kb/AttachmentsPanel";
import NoteEditor from "@/components/kb/NoteEditor";
import { listByNote } from "@/lib/attachments";
import { getKbNote } from "@/lib/kb-content";
import { getSessionUser } from "@/lib/session";

// 编辑一篇已有笔记:编辑器 + 附件面板 + 历史版本入口 + 删除
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditNotePage({ params }: Props) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const note = await getKbNote(Number(id), sessionUser);
  if (!note) notFound();
  const files = await listByNote(note.id);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">编辑:{note.title}</h1>
        <div className="flex items-center gap-4 text-sm">
          <Link href={`/kb/notes/${note.id}/versions`} className="text-accent hover:underline">
            历史版本
          </Link>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <NoteEditor
          mode="edit"
          note={{
            id: note.id,
            type: note.type,
            slug: note.slug,
            title: note.title,
            excerpt: note.excerpt,
            content: note.content,
            tags: note.tags,
          }}
        />
        <AttachmentsPanel
          noteId={note.id}
          initial={files.map((f) => ({
            id: f.id,
            filename: f.filename,
            mime: f.mime,
            size: f.size,
          }))}
        />
      </div>
    </main>
  );
}
