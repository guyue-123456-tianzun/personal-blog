import NoteEditor from "@/components/kb/NoteEditor";

export const metadata = { title: "写新笔记" };

export default function NewNotePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold">写新笔记</h1>
      <p className="mt-1 text-sm opacity-60">
        保存后就能上传附件、查历史版本;发布到博客是下一步的事(M2 后台)。
      </p>
      <div className="mt-6">
        <NoteEditor mode="create" />
      </div>
    </main>
  );
}
