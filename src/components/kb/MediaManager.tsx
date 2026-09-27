"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = {
  id: number;
  type: string;
  title: string;
  status: string;
  rating: number | null;
  comment: string | null;
};

type Props = { initial: Item[] };

const TYPES = [
  { key: "book", label: "书籍" },
  { key: "movie", label: "影视" },
  { key: "anime", label: "动漫" },
  { key: "music", label: "音乐" },
  { key: "game", label: "游戏" },
];

const STATUS_BY_TYPE: Record<string, { key: string; label: string }[]> = {
  book: [
    { key: "wish", label: "想读" },
    { key: "doing", label: "在读" },
    { key: "done", label: "读完" },
  ],
  movie: [
    { key: "wish", label: "想看" },
    { key: "doing", label: "在看" },
    { key: "done", label: "看过" },
  ],
  game: [
    { key: "wish", label: "想玩" },
    { key: "doing", label: "在玩" },
    { key: "done", label: "玩过" },
  ],
};

type FormState = {
  id: number | null;
  type: string;
  title: string;
  status: string;
  rating: string;
  comment: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  type: "book",
  title: "",
  status: "wish",
  rating: "",
  comment: "",
};

// 书影音管理:添加/编辑/删除一条记录(表单复用)
export default function MediaManager({ initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  function edit(item: Item) {
    setForm({
      id: item.id,
      type: item.type,
      title: item.title,
      status: item.status,
      rating: item.rating === null ? "" : String(item.rating),
      comment: item.comment ?? "",
    });
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim()) {
      setStatus("标题不能为空");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const payload = {
        type: form.type,
        title: form.title.trim(),
        status: form.status,
        rating: form.rating === "" ? null : Number(form.rating),
        comment: form.comment.trim() || null,
      };
      const res = await fetch(
        form.id ? `/api/kb/media/${form.id}` : "/api/kb/media",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus(data.error ?? "保存失败");
        return;
      }
      setStatus(form.id ? "已更新 ✓" : "已添加 ✓");
      setForm(EMPTY_FORM);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("确定删除这条记录?")) return;
    setBusy(true);
    await fetch(`/api/kb/media/${id}`, { method: "DELETE" });
    if (form.id === id) setForm(EMPTY_FORM);
    router.refresh();
    setBusy(false);
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";
  const statuses = STATUS_BY_TYPE[form.type] ?? [];

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="glass space-y-3 rounded-2xl p-5">
        <h3 className="font-semibold">
          {form.id ? `编辑记录 #${form.id}` : "添加一条记录"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={form.type}
            onChange={(e) => {
              const type = e.target.value;
              setForm((f) => ({
                ...f,
                type,
                status: STATUS_BY_TYPE[type]?.[0].key ?? "wish",
              }));
            }}
            className={inputClass}
          >
            {TYPES.map((type) => (
              <option key={type.key} value={type.key}>
                {type.label}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="标题(书名/片名/游戏名)"
            className={`${inputClass} sm:col-span-2`}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className={inputClass}
          >
            {statuses.map((status) => (
              <option key={status.key} value={status.key}>
                {status.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={10}
            value={form.rating}
            onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
            placeholder="评分 0~10(可空)"
            className={inputClass}
          />
          <input
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            placeholder="一句话短评(可空)"
            className={`${inputClass} sm:col-span-1`}
          />
        </div>
        <textarea
          value={form.comment}
          onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
          placeholder="长评也可以写在这里(可空)"
          rows={2}
          className={`${inputClass} resize-none`}
        />
        <div className="flex items-center justify-end gap-3">
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="text-sm text-accent hover:underline"
            >
              取消编辑
            </button>
          )}
          {status && <span className="text-xs opacity-70">{status}</span>}
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "保存中…" : form.id ? "保存修改" : "添加"}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {initial.length === 0 && <p className="opacity-60">还没有记录。</p>}
        {initial.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm"
          >
            <span className="min-w-0 truncate">
              <span className="rounded-full border border-border px-2 py-0.5 text-xs opacity-60">
                {TYPES.find((t) => t.key === item.type)?.label ?? item.type}
              </span>
              <span className="ml-2 font-medium">{item.title}</span>
              <span className="ml-2 opacity-50">
                {STATUS_BY_TYPE[item.type]?.find((s) => s.key === item.status)?.label ??
                  item.status}
                {item.rating !== null && ` · ${item.rating}/10`}
              </span>
            </span>
            <span className="flex shrink-0 gap-3 text-sm">
              <button onClick={() => edit(item)} className="text-accent hover:underline">
                编辑
              </button>
              <button
                onClick={() => remove(item.id)}
                className="text-red-500 hover:underline"
              >
                删除
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
