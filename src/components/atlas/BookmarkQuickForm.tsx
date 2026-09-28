"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

// 工作台里的书签快捷添加:只收标题/网址/一句话说明;
// 整理(编辑/删除)仍在书签管理页,这里追求"三秒存一条"。
export default function BookmarkQuickForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setStatus("标题和网址都要填");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/kb/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          title: title.trim(),
          url: url.trim(),
          description: desc.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        bookmark?: unknown;
      };
      if (!res.ok || !data.bookmark) {
        setStatus(data.error ?? "添加失败");
        return;
      }
      setTitle("");
      setUrl("");
      setDesc("");
      setStatus("书签已入库 ✓");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题(页面名)"
        className={inputClass}
      />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        type="url"
        className={inputClass}
      />
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="一句话说明(可空)"
        className={inputClass}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-accent px-5 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "保存中…" : "收藏"}
        </button>
        {status && <span className="text-xs opacity-70">{status}</span>}
      </div>
    </form>
  );
}
