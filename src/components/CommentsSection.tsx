"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CommentItem = { id: number; author: string; content: string; createdAt: string };

type Props = { slug: string; initial: CommentItem[] };

// 文章评论区:游客填昵称即可留言;提交后刷新列表。站长可在后台隐藏/删除
export default function CommentsSection({ slug, initial }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState(initial);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, author, content }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        comment?: CommentItem;
      };
      if (!res.ok || !data.comment) {
        setStatus(data.error ?? "提交失败");
        return;
      }
      setComments((list) => [...list, data.comment!]);
      setContent("");
      setStatus("评论成功 ✓");
      router.refresh();
    } catch {
      setStatus("网络异常,请重试");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold">评论({comments.length})</h2>

      <div className="mt-4 space-y-3">
        {comments.length === 0 && (
          <p className="text-sm opacity-60">还没有评论,坐个沙发?</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="glass rounded-xl p-4">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{comment.author}</span>
              <span className="text-xs opacity-50">
                {comment.createdAt.slice(0, 16)}
              </span>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm opacity-85">
              {comment.content}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="glass mt-6 space-y-3 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">留下你的评论</h3>
          {status && <span className="text-xs opacity-70">{status}</span>}
        </div>
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="昵称"
          maxLength={20}
          required
          className={inputClass}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="说点什么…"
          rows={3}
          maxLength={500}
          required
          className={inputClass}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "提交中…" : "提交评论"}
          </button>
        </div>
      </form>
    </section>
  );
}
