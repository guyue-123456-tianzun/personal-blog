"use client";

import { useState } from "react";

import { rankNotes } from "@/lib/retrieval";

export type AtlasNote = {
  id: number;
  type: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPublic: number;
};

type Props = {
  notes: AtlasNote[];
  aiEnabled: boolean;
  onOpenNote: (id: number) => void;
};

// 问一问你的知识库(参考 Khoj):先在本地捞出相关笔记,再带着这些内容问大模型,
// 回答里会标注 [资料N] 对应哪几篇
export default function AskPanel({ notes, aiEnabled, onOpenNote }: Props) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [sources, setSources] = useState<AtlasNote[]>([]);

  async function ask() {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setError("");
    setAnswer("");
    const hits = rankNotes(notes, q);
    setSources(hits);
    try {
      const res = await fetch("/api/kb/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          sources: hits.map((note) => ({
            title: note.title,
            content: note.content.slice(0, 1500),
          })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        answer?: string;
        error?: string;
      };
      if (!res.ok || !data.answer) {
        setError(data.error ?? "问答失败");
        return;
      }
      setAnswer(data.answer);
    } catch {
      setError("网络异常,再试一次");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass rounded-2xl p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="inline-block h-4 w-1 rounded-full bg-accent" />
        问一问知识库
      </h3>

      {!aiEnabled ? (
        <p className="text-xs leading-relaxed opacity-60">
          还没配置 AI 服务。去
          <a href="/kb/ai" className="mx-1 text-accent hover:underline">
            AI 助手设置
          </a>
          填好接口地址和 Key,就能在这里用自然语言问整个知识库。
        </p>
      ) : (
        <>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              // 回车发问,Shift+回车换行
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void ask();
              }
            }}
            rows={2}
            placeholder="比如:我记过哪些跟部署有关的东西?"
            className="w-full resize-none rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] opacity-45">
              回车发送 · 答案只依据你自己的笔记
            </span>
            <button
              onClick={() => void ask()}
              disabled={busy || !question.trim()}
              className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "检索中…" : "提问"}
            </button>
          </div>

          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

          {answer && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                {answer}
              </p>
              {sources.length > 0 && (
                <div className="mt-3">
                  <p className="text-[11px] opacity-45">参考到的笔记</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {sources.map((note, index) => (
                      <button
                        key={note.id}
                        onClick={() => onOpenNote(note.id)}
                        className="rounded-full border border-border px-2.5 py-1 text-[11px] opacity-75 transition-opacity hover:opacity-100"
                      >
                        资料{index + 1} · {note.title.slice(0, 14)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
