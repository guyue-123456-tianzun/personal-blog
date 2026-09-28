"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 发说说的表单:短文字 + 最多 4 张图 + 标签 + 公开开关。
// 图片在提交时才上传(自动挂到这条说说上),预览用本地对象地址。
export default function MomentComposer() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).slice(0, 4 - files.length);
    e.target.value = "";
    if (picked.length === 0) return;
    setFiles((list) => [...list, ...picked]);
    setPreviews((list) => [...list, ...picked.map((f) => URL.createObjectURL(f))]);
  }

  function removeImage(index: number) {
    setFiles((list) => list.filter((_, i) => i !== index));
    setPreviews((list) => list.filter((_, i) => i !== index));
  }

  async function submit() {
    const text = content.trim();
    if (!text) {
      setStatus("写点什么再发吧");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/kb/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "moment",
          title: text.split("\n")[0].slice(0, 30) || "说说",
          content: text,
          tags: tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
          isPublic: isPublic ? 1 : 0,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        note?: { id: number };
      };
      if (!res.ok || !data.note) {
        setStatus(data.error ?? "发布失败");
        return;
      }
      // 图逐张上传并挂到这条说说上
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("noteId", String(data.note.id));
        form.append("public", isPublic ? "1" : "0");
        await fetch("/api/kb/attachments", { method: "POST", body: form });
      }
      setContent("");
      setTags("");
      setFiles([]);
      setPreviews([]);
      setStatus("已发布 ✓");
      router.refresh();
    } catch {
      setStatus("网络异常,请重试");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="glass space-y-3 rounded-2xl p-5">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="此刻在想什么?"
        rows={3}
        maxLength={1000}
        className={`${inputClass} resize-none`}
      />
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((preview, index) => (
            <div key={preview} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="h-20 w-20 rounded-lg object-cover" />
              <button
                onClick={() => removeImage(index)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                aria-label="移除图片"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="标签,逗号隔开,如:日常, 咖啡"
        className={inputClass}
      />
      {/* 配图入口:onFiles 之前写好了却没人调用,导致"最多 4 张配图"实际传不了图 */}
      <label
        className={`inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm transition-opacity hover:opacity-80 ${
          files.length >= 4 ? "pointer-events-none opacity-40" : ""
        }`}
      >
        📷 配图({files.length}/4)
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onFiles}
          className="hidden"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          公开发布(不勾选=仅自己可见)
        </label>
        <div className="flex items-center gap-3">
          {status && <span className="text-xs opacity-70">{status}</span>}
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-lg bg-accent px-5 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "发布中…" : "发布说说"}
          </button>
        </div>
      </div>
      <p className="text-xs opacity-40">配图可选,最多 4 张,发布时随说说一起上传。</p>
    </div>
  );
}
