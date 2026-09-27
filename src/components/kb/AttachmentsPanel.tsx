"use client";

import { useState } from "react";

type Item = {
  id: number;
  filename: string;
  mime: string;
  size: number;
};

type Props = { noteId: number; initial: Item[] };

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// 附件面板:上传、复制 Markdown 引用、删除。
// 引用规则:图片给 ![](地址) 嵌进正文,其他给 [文件名](地址) 当下载链接
export default function AttachmentsPanel({ noteId, initial }: Props) {
  const [items, setItems] = useState<Item[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 允许连续传同一个文件
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("noteId", String(noteId));
      const res = await fetch("/api/kb/attachments", {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        attachment?: Item;
      };
      if (!res.ok || !data.attachment) {
        setError(data.error ?? "上传失败");
        return;
      }
      setItems((list) => [data.attachment!, ...list]);
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("确定删除这个附件?")) return;
    const res = await fetch(`/api/kb/attachments/${id}`, { method: "DELETE" });
    if (res.ok) setItems((list) => list.filter((it) => it.id !== id));
  }

  async function copyRef(item: Item) {
    const url = `/api/kb/attachments/${item.id}`;
    const ref = item.mime.startsWith("image/")
      ? `![${item.filename}](${url})`
      : `[${item.filename}](${url})`;
    await navigator.clipboard.writeText(ref);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">附件({items.length})</h3>
        <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm transition-opacity hover:opacity-80">
          {uploading ? "上传中…" : "+ 上传附件"}
          <input type="file" onChange={upload} className="hidden" disabled={uploading} />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      {items.length === 0 ? (
        <p className="mt-2 text-sm opacity-50">
          还没有附件。可传图片 / PDF / Office 文档,单个 ≤ 20MB。
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <a
                href={`/api/kb/attachments/${item.id}`}
                target="_blank"
                className="truncate text-accent hover:underline"
              >
                {item.filename}
              </a>
              <span className="flex shrink-0 items-center gap-2 text-xs opacity-60">
                {humanSize(item.size)}
                <button onClick={() => copyRef(item)} className="text-accent hover:underline">
                  {copied === item.id ? "已复制" : "复制引用"}
                </button>
                <button onClick={() => remove(item.id)} className="text-red-500 hover:underline">
                  删除
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
