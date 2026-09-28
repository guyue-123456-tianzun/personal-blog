"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// 番组计划·站长快捷添加:把后台"添加一条记录"搬进公开书影音页——
// 登录的站长看到这块内联表单,不用再跳后台;访客完全看不到它。
// 只收最常用的五个字段,长评等细节仍去后台补。
const TYPES = [
  { value: "book", label: "书籍" },
  { value: "movie", label: "影视" },
  { value: "anime", label: "动漫" },
  { value: "music", label: "音乐" },
  { value: "game", label: "游戏" },
];
const STATUS = [
  { value: "wish", label: "想看/想读" },
  { value: "doing", label: "在看/在读" },
  { value: "done", label: "看过/读完" },
];

const inputClass =
  "rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-accent";

export default function MediaQuickAdd() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("book");
  const [status, setStatus] = useState("done");
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function submit() {
    if (!title.trim()) {
      setHint("先填个标题");
      return;
    }
    setBusy(true);
    setHint("");
    try {
      const res = await fetch("/api/kb/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          status,
          rating: rating ? Number(rating) : undefined,
          comment: comment.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({})) as { error?: string });
      if (!res.ok) {
        setHint(data.error ?? "添加失败");
        return;
      }
      setTitle("");
      setRating("");
      setComment("");
      setHint("已添加 ✓");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-medium text-accent"
      >
        <span>✏️ 站长快捷添加(不用去后台)</span>
        <span>{open ? "收起 ⌃" : "展开 ⌄"}</span>
      </button>

      {open && (
        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="mt-3 grid gap-2 sm:grid-cols-2"
        >
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
            aria-label="类型"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题(书名/片名/游戏名)"
            className={inputClass}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
            aria-label="状态"
          >
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            value={rating}
            onChange={(e) => setRating(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="评分 0~10(可空)"
            inputMode="decimal"
            className={inputClass}
          />
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="一句话短评(可空)"
            className={`${inputClass} sm:col-span-2`}
          />
          <div className="flex items-center gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-accent px-5 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "添加中…" : "添加"}
            </button>
            {hint && <span className="text-xs opacity-70">{hint}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
