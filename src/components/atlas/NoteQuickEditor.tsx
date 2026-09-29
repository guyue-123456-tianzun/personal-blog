"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

// 工作台里的笔记快捷编辑:标题/标签/正文/公开开关,保存就在工作台内完成。
// 以前这里跳旧后台 /kb/notes/new——旧后台已退役,新建笔记不再离开工作台。
export default function NoteQuickEditor() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function submit() {
    if (!title.trim() || !content.trim()) {
      setStatus("标题和正文都要写");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/kb/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "note",
          title: title.trim(),
          content,
          tags: tags
            .split(/[,，]/)
            .map((t) => t.trim())
            .filter(Boolean),
          isPublic,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus(data.error ?? "保存失败");
        return;
      }
      setTitle("");
      setTags("");
      setContent("");
      setIsPublic(0);
      setStatus("已保存 ✓(列表和图谱已更新)");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2.5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题"
        className={inputClass}
      />
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="标签,逗号隔开(如:随笔,部署)"
        className={inputClass}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="正文,支持 Markdown 语法…"
        rows={8}
        className={`${inputClass} resize-y leading-6`}
      />
      <label className="flex items-center gap-2 text-sm opacity-80">
        <input
          type="checkbox"
          checked={isPublic === 1}
          onChange={(e) => setIsPublic(e.target.checked ? 1 : 0)}
          className="accent-[var(--accent)]"
        />
        公开到博客(勾选后访客可见,不勾仅自己可见)
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-full bg-accent px-5 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "保存中…" : "保存"}
        </button>
        {status && <span className="text-xs opacity-70">{status}</span>}
      </div>
      <p className="text-xs opacity-45">
        附件、版本历史这些完整排版,后续轮会搬进工作台。
      </p>
    </div>
  );
}
