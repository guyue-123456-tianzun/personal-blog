"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 网页剪藏表单(B2):粘贴 URL,服务端抓正文存为剪藏笔记
export default function ClipForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/kb/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          tags: tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setUrl("");
        setTags("");
        setStatus("剪藏成功 ✓");
        router.refresh();
      } else {
        setStatus(data.error ?? "剪藏失败");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass space-y-3 rounded-2xl p-5">
      <div className="flex flex-wrap gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="粘贴要剪藏的网页地址 https://…"
          required
          className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="标签,逗号隔开"
          className="w-40 rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "抓取中…" : "剪藏"}
        </button>
      </div>
      {status && <p className="text-xs opacity-70">{status}</p>}
    </form>
  );
}
