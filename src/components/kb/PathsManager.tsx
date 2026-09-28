"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PathItem = {
  id: number;
  title: string;
  description: string | null;
  nodes: { id: number; title: string; done: number }[];
};

type Props = { initial: PathItem[] };

// 学习路线管理(B7):创建路线 → 添加节点 → 勾选完成(进度条实时更新)
export default function PathsManager({ initial }: Props) {
  const router = useRouter();
  const [paths] = useState(initial);
  const [newTitle, setNewTitle] = useState("");
  const [nodeTitle, setNodeTitle] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch("/api/kb/paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.ok;
    } finally {
      setBusy(false);
    }
  }

  async function createPath() {
    if (!newTitle.trim()) return;
    const ok = await post({ action: "create", title: newTitle });
    if (ok) {
      setNewTitle("");
      router.refresh();
    }
  }

  async function addNode(pathId: number) {
    const title = nodeTitle[pathId]?.trim();
    if (!title) return;
    const ok = await post({ action: "add-node", pathId, title });
    if (ok) {
      setNodeTitle((m) => ({ ...m, [pathId]: "" }));
      router.refresh();
    }
  }

  async function toggleNode(nodeId: number) {
    const ok = await post({ action: "toggle-node", nodeId });
    if (ok) router.refresh();
  }

  async function deletePath(pathId: number) {
    if (!window.confirm("删除整条路线(节点一并删除)?")) return;
    const ok = await post({ action: "delete-path", pathId });
    if (ok) router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="glass flex gap-2 rounded-2xl p-4">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="新路线标题,如:前端学习路线"
          className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          onClick={createPath}
          disabled={busy}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          创建
        </button>
      </div>

      {paths.length === 0 ? (
        <p className="opacity-60">还没有路线,创建第一条吧。</p>
      ) : (
        <div className="space-y-4">
          {paths.map((path) => {
            const done = path.nodes.filter((n) => n.done).length;
            const pct = path.nodes.length
              ? Math.round((done / path.nodes.length) * 100)
              : 0;
            return (
              <div key={path.id} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">{path.title}</h3>
                  <button
                    onClick={() => deletePath(path.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    删除路线
                  </button>
                </div>
                {path.description && (
                  <p className="mt-1 text-sm opacity-60">{path.description}</p>
                )}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs opacity-50">进度 {pct}%</p>

                <div className="mt-3 space-y-1.5">
                  {path.nodes.map((node) => (
                    <label
                      key={node.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-foreground/5"
                    >
                      <input
                        type="checkbox"
                        checked={node.done === 1}
                        onChange={() => toggleNode(node.id)}
                        className="accent-[var(--accent)]"
                      />
                      <span className={node.done ? "opacity-40 line-through" : ""}>
                        {node.title}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={nodeTitle[path.id] ?? ""}
                    onChange={(e) =>
                      setNodeTitle((m) => ({ ...m, [path.id]: e.target.value }))
                    }
                    placeholder="添加节点…"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => addNode(path.id)}
                    disabled={busy}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
                  >
                    添加
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
