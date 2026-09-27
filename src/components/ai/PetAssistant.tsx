"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

type Props = { enabled?: boolean };

// AI 桌宠「绘梨衣」:右下角常驻,点击展开聊天气泡。
// 问答走 /api/ai/chat(站长在外观后台配置自己的 AI 接口),会话仅保存在当前页面。
export default function PetAssistant({ enabled = true }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "你好呀,我是绘梨衣~ 这个网站有什么好玩的,问我就对了!嘿嘿。",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const history = messages.slice(-8);
    setMessages((list) => [...list, { role: "user", content: text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
      };
      setMessages((list) => [
        ...list,
        { role: "assistant", content: data.reply ?? data.error ?? "…" },
      ]);
    } catch {
      setMessages((list) => [
        ...list,
        { role: "assistant", content: "网络开小差了,再说一次好不好?" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {/* 聊天面板 */}
      {open && (
        <div className="glass flex h-[26rem] w-80 flex-col overflow-hidden rounded-2xl shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/pet-erii.png"
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold leading-4">绘梨衣</p>
              <p className="text-[10px] opacity-50">
                {busy ? "正在想…" : "在线 · Sakura~"}
              </p>
            </div>
            <button
              onClick={() =>
                setMessages((list) => list.slice(0, 1))
              }
              title="清空对话"
              className="rounded-full px-2 py-0.5 text-xs opacity-50 transition-opacity hover:opacity-100"
            >
              清空
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="收起"
              className="rounded-full px-2 py-0.5 text-sm opacity-50 transition-opacity hover:opacity-100"
            >
              ×
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-end gap-1.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="/images/pet-erii.png"
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full object-cover"
                  />
                )}
                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-5 ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-accent text-white"
                      : "glass rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </p>
              </div>
            ))}
            {busy && (
              <div className="flex items-end gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/pet-erii.png"
                  alt=""
                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                />
                <p className="glass rounded-bl-sm rounded-2xl px-3 py-2 text-sm opacity-70">
                  绘梨衣在想…
                </p>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-border p-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="和我说点什么…"
              maxLength={500}
              className="min-w-0 flex-1 rounded-full border border-border bg-transparent px-3.5 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy}
              aria-label="发送"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-transform hover:scale-105 disabled:opacity-50"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* 桌宠本体:呼吸浮动,点击展开/收起 */}
      <div className="relative">
        {!open && (
          <div className="glass absolute bottom-1 right-full mr-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs">
            点我聊天~ 嘿嘿
          </div>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="绘梨衣 AI 助手"
          className="pet-bob block cursor-pointer transition-transform hover:scale-105"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/pet-erii.png"
            alt="绘梨衣"
            className="h-28 w-auto object-contain drop-shadow-2xl"
          />
        </button>
      </div>
    </div>
  );
}
