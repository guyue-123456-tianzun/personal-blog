"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Markdown } from "@/components/Markdown";

type EditorNote = {
  id: number;
  type: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  tags: string[];
};

type Props = { mode: "create" | "edit"; note?: EditorNote };

// 笔记编辑器:左边写 Markdown,右边实时预览(小屏时上下排,用按钮切换)。
// 每次保存,服务器都会先把改动前的版本存进历史——所以放心大胆地改。
export default function NoteEditor({ mode, note }: Props) {
  const router = useRouter();
  const [id, setId] = useState<number | null>(note?.id ?? null);
  const [title, setTitle] = useState(note?.title ?? "");
  const [slug, setSlug] = useState(note?.slug ?? "");
  const [tags, setTags] = useState(note?.tags.join(", ") ?? "");
  const [excerpt, setExcerpt] = useState(note?.excerpt ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [showPreview, setShowPreview] = useState(false);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) {
      setStatus("标题不能为空");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      const payload = {
        title,
        content,
        slug: slug || undefined,
        excerpt: excerpt || undefined,
        tags: tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      };
      const res = id
        ? await fetch(`/api/kb/notes/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/kb/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, type: note?.type ?? "note" }),
          });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        note?: { id: number };
      };
      if (!res.ok) {
        setStatus(data.error ?? "保存失败,请重试");
        return;
      }
      if (!id && data.note?.id) {
        setId(data.note.id);
        router.replace(`/kb/notes/${data.note.id}`); // 新建后把地址换成编辑页,刷新也不丢
      } else {
        setStatus("已保存 ✓(旧版本已自动存档)");
        router.refresh();
      }
    } catch {
      setStatus("网络异常,请重试");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-transparent px-3 py-2 outline-none focus:border-accent";

  return (
    <div className="space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题"
        className={`${inputClass} text-xl font-semibold`}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="链接标识(留空自动生成)"
          className={inputClass}
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="标签,用逗号隔开,如:随笔, 部署"
          className={inputClass}
        />
      </div>
      <input
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        placeholder="摘要(可空,列表页展示用)"
        className={inputClass}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 sm:hidden">
          <button
            onClick={() => setShowPreview(false)}
            className={`rounded-lg border border-border px-3 py-1.5 text-sm ${!showPreview ? "bg-accent text-white" : ""}`}
          >
            编辑
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`rounded-lg border border-border px-3 py-1.5 text-sm ${showPreview ? "bg-accent text-white" : ""}`}
          >
            预览
          </button>
        </div>
        <p className="hidden text-xs opacity-50 sm:block">
          支持 Markdown;Ctrl+S / Cmd+S 也可以保存
        </p>
        <div className="flex items-center gap-3">
          {status && <span className="text-sm opacity-70">{status}</span>}
          {mode === "edit" && id && (
            <Link
              href={`/kb/notes/${id}/versions`}
              className="text-sm text-accent hover:underline"
            >
              历史版本
            </Link>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
              e.preventDefault();
              save();
            }
          }}
          placeholder="正文,Markdown 语法。写完点「保存」。"
          rows={20}
          className={`${inputClass} font-mono text-sm ${showPreview ? "hidden sm:block" : ""}`}
        />
        <div
          className={`min-h-[20rem] rounded-lg border border-border bg-card p-4 ${showPreview ? "" : "hidden lg:block"}`}
        >
          {content.trim() ? (
            <Markdown content={content} />
          ) : (
            <p className="text-sm opacity-50">预览区:正文写点东西就能看到效果。</p>
          )}
        </div>
      </div>
    </div>
  );
}
