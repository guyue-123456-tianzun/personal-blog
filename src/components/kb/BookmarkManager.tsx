"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { id: number; title: string; url: string; description: string | null };

// 书签管理(C2):添加/删除
export default function BookmarkManager({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/kb/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", title, url, description: desc }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        bookmark?: Item;
      };
      if (!res.ok || !data.bookmark) {
        setError(data.error ?? "添加失败");
        return;
      }
      setItems((list) => [data.bookmark!, ...list]);
      setTitle("");
      setUrl("");
      setDesc("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    await fetch("/api/kb/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    setItems((list) => list.filter((it) => it.id !== id));
    setBusy(false);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="glass space-y-3 rounded-2xl p-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="书签名称"
          required
          className={inputClass}
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="网址 https://…"
          required
          className={inputClass}
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="备注(可空)"
          className={inputClass}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          添加书签
        </button>
      </form>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
          >
            <a
              href={item.url}
              target="_blank"
              className="min-w-0 flex-1 truncate text-sm hover:text-accent"
            >
              {item.title}
              <span className="ml-2 opacity-40">{item.url}</span>
            </a>
            <button
              onClick={() => remove(item.id)}
              disabled={busy}
              className="shrink-0 text-sm text-red-500 hover:underline disabled:opacity-50"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
