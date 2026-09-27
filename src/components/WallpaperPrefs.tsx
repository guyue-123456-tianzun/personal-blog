"use client";

import { useEffect, useRef, useState } from "react";

// 访客的壁纸轮播偏好面板:存在浏览器 localStorage,只影响自己,不影响别人。
// 修改后派发 wallprefs 事件,背景组件实时跟随。
export default function WallpaperPrefs() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null); // null = 未读取
  const [seconds, setSeconds] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const savedOn = localStorage.getItem("wallCarouselOn");
      const savedSec = Number(localStorage.getItem("wallCarouselSec"));
      setEnabled(savedOn === null ? true : savedOn === "1");
      setSeconds(
        Number.isFinite(savedSec) && savedSec >= 1
          ? Math.min(60, Math.round(savedSec))
          : 3,
      );
    } catch {
      setEnabled(true);
      setSeconds(3);
    }
  }, []);

  // 点击面板外部关闭
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function persist(next: { enabled?: boolean; seconds?: number }) {
    const merged = {
      enabled: next.enabled ?? enabled ?? true,
      seconds: next.seconds ?? seconds ?? 3,
    };
    try {
      localStorage.setItem("wallCarouselOn", merged.enabled ? "1" : "0");
      localStorage.setItem("wallCarouselSec", String(merged.seconds));
    } catch {
      // 忽略:本次会话内仍可通过事件生效
    }
    window.dispatchEvent(new Event("wallprefs"));
    if (next.enabled !== undefined && next.seconds === undefined) {
      window.dispatchEvent(new CustomEvent("wallskip", { detail: 1 }));
    }
  }

  function skip(delta: number) {
    window.dispatchEvent(new CustomEvent("wallskip", { detail: delta }));
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="壁纸轮播设置"
        title="壁纸轮播设置"
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-foreground/10"
      >
        🖼️
      </button>

      {open && (
        <div className="glass absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl p-4 text-sm shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-semibold">壁纸轮播</span>
            <button
              onClick={() => persist({ enabled: !(enabled ?? true) })}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                enabled
                  ? "bg-accent text-white"
                  : "border border-border opacity-70"
              }`}
            >
              {enabled ? "轮播中" : "已关闭"}
            </button>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>切换间隔</span>
              <span>{seconds ?? 3} 秒</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={seconds ?? 3}
              onChange={(e) => setSeconds(Number(e.target.value))}
              onMouseUp={() => seconds && persist({ seconds })}
              onTouchEnd={() => seconds && persist({ seconds })}
              className="mt-1.5 w-full accent-[var(--accent)]"
            />
          </div>

          <div className="mt-3 flex justify-center gap-3 text-xs">
            <button
              onClick={() => skip(-1)}
              className="rounded-full border border-border px-3 py-1 transition-colors hover:bg-foreground/10"
            >
              ⏮ 上一张
            </button>
            <button
              onClick={() => skip(1)}
              className="rounded-full border border-border px-3 py-1 transition-colors hover:bg-foreground/10"
            >
              下一张 ⏭
            </button>
          </div>
          <p className="mt-3 text-[10px] leading-4 opacity-40">
            此设置只保存在你的浏览器里,每位访客都可以有自己的壁纸节奏。
          </p>
        </div>
      )}
    </div>
  );
}
