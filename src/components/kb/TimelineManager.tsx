"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { id: number; date: string; title: string; content: string | null };

// 成长时间线管理(B8):添加大事记 + 删除
export default function TimelineManager({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/kb/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", date, title, content }),
      });
      if (res.ok) {
        setItems((list) => [
          { id: Date.now(), date, title, content },
          ...list,
        ]);
        setTitle("");
        setContent("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("删除这条大事记?")) return;
    await fetch("/api/kb/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    setItems((list) => list.filter((it) => it.id !== id));
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="glass space-y-3 rounded-2xl p-5">
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="大事记标题"
            required
            className={inputClass}
          />
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="详情(可空)"
          rows={2}
          className={`${inputClass} resize-none`}
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          添加大事记
        </button>
      </form>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3.5 text-sm"
          >
            <div className="min-w-0">
              <span className="mr-2 text-xs opacity-50">{item.date}</span>
              <span className="font-medium">{item.title}</span>
              {item.content && (
                <p className="mt-1 text-xs opacity-60">{item.content}</p>
              )}
            </div>
            <button
              onClick={() => remove(item.id)}
              className="shrink-0 text-xs text-red-500 hover:underline"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
