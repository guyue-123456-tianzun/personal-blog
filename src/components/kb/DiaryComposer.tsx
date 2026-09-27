"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 日记撰写(B5):今天的日记,私密保存
export default function DiaryComposer() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function submit() {
    if (!content.trim()) {
      setStatus("写点什么吧");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch("/api/kb/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "diary",
          title: `日记 ${today}`,
          content,
          isPublic: 0,
          publishedAt: today,
        }),
      });
      if (res.ok) {
        setContent("");
        setStatus("日记已保存 ✓(仅自己可见)");
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setStatus(data.error ?? "保存失败");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass space-y-3 rounded-2xl p-5">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="今天过得怎么样?"
        rows={4}
        className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs opacity-50">🔒 日记严格私密,只有你能看</span>
        <div className="flex items-center gap-3">
          {status && <span className="text-xs opacity-70">{status}</span>}
          <button
            onClick={submit}
            disabled={busy}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "保存中…" : "保存日记"}
          </button>
        </div>
      </div>
    </div>
  );
}
