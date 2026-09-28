"use client";

import { useEffect, useState } from "react";

import { siteConfig } from "@/lib/site-config";

// 打字机横幅:公告句子轮播——打出来,停一下,擦掉,换下一句
export default function TypewriterBanner({ className = "" }: { className?: string }) {
  const phrases = siteConfig.announcements;
  const [text, setText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "holding" | "erasing">("typing");

  useEffect(() => {
    const current = phrases[phraseIndex % phrases.length];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (text.length < current.length) {
        timer = setTimeout(() => setText(current.slice(0, text.length + 1)), 130);
      } else {
        timer = setTimeout(() => setPhase("erasing"), 1800);
      }
    } else if (phase === "erasing") {
      if (text.length > 0) {
        timer = setTimeout(() => setText(current.slice(0, text.length - 1)), 45);
      } else {
        setPhase("typing");
        setPhraseIndex((i) => (i + 1) % phrases.length);
      }
    }
    return () => clearTimeout(timer);
  }, [text, phase, phraseIndex, phrases]);

  return (
    <div className={`glass rounded-2xl px-5 py-4 ${className}`}>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span className="inline-block h-4 w-1 rounded-full bg-accent" />
        公告
      </h3>
      {/* 固定最小高度:打字/擦字的过程中卡片不会一跳一跳 */}
      <p className="min-h-6 font-mono text-sm leading-relaxed">
        {text}
        <span className="animate-pulse text-accent">|</span>
      </p>
    </div>
  );
}
