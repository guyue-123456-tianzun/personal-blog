"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LinkItem = {
  id: number;
  name: string;
  url: string;
  category: string;
};

// 导航页链接管理(C4):添加/删除,按分组展示
export default function NavLinksManager({ initial }: { initial: LinkItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("常用");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/kb/navlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", name, url, category }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        link?: LinkItem;
      };
      if (!res.ok || !data.link) {
        setError(data.error ?? "添加失败");
        return;
      }
      setItems((list) => [...list, data.link!]);
      setName("");
      setUrl("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    try {
      await fetch("/api/kb/navlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      setItems((list) => list.filter((it) => it.id !== id));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

  const groups = [...new Set(items.map((it) => it.category))];

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="glass space-y-3 rounded-2xl p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名称"
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
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="分组"
            className={inputClass}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          添加链接
        </button>
      </form>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group} className="glass rounded-2xl p-4">
            <h3 className="mb-2 font-semibold">{group}</h3>
            <ul className="space-y-1.5">
              {items
                .filter((it) => it.category === group)
                .map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-foreground/5"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      className="min-w-0 flex-1 truncate hover:text-accent"
                    >
                      {item.name}
                      <span className="ml-2 text-xs opacity-40">{item.url}</span>
                    </a>
                    <button
                      onClick={() => remove(item.id)}
                      className="shrink-0 text-xs text-red-500 hover:underline"
                    >
                      删除
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
