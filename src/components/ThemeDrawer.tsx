"use client";

import { useEffect, useRef, useState } from "react";

import {
  applyAccentHue,
  readThemePrefs,
  saveThemePrefs,
  THEME_PREFS_EVENT,
  type ThemePrefs,
} from "@/lib/theme-prefs";

// 访客主题面板(参考站 DreamStory 的"主题外观"抽屉):
// 主题色调 / 壁纸模式 / 壁纸虚化 / 壁纸轮播 / 樱花特效 / 漂浮粒子 / 文章布局。
// 全部存在访客自己的浏览器里,只影响自己,不影响别人。
export default function ThemeDrawer() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<ThemePrefs | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sync = () => {
      const loaded = readThemePrefs();
      setPrefs(loaded);
      applyAccentHue(loaded.accentH);
      document.documentElement.classList.toggle("no-particles", !loaded.particles);
    };
    sync();
    window.addEventListener(THEME_PREFS_EVENT, sync);
    return () => window.removeEventListener(THEME_PREFS_EVENT, sync);
  }, []);

  // 点击抽屉外部关闭
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

  function update(partial: Partial<ThemePrefs>) {
    saveThemePrefs(partial);
    const loaded = readThemePrefs();
    setPrefs(loaded);
    applyAccentHue(loaded.accentH);
    document.documentElement.classList.toggle("no-particles", !loaded.particles);
  }

  const p = prefs ?? {
    accentH: null,
    wallMode: "wallpaper" as const,
    wallBlur: null,
    wallCarouselOn: null,
    wallCarouselSec: null,
    sakura: true,
    particles: true,
    articleMode: "grid" as const,
  };
  const wallBlur = p.wallBlur ?? 18;
  const carouselOn = p.wallCarouselOn ?? true;
  const carouselSec = p.wallCarouselSec ?? 3;

  const inputCls = "w-full accent-[var(--accent)]";

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="主题外观设置"
        title="主题外观设置"
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-foreground/10"
      >
        🎨
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            className="glass fixed right-0 top-0 z-[70] h-full w-80 overflow-y-auto p-5 text-sm shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">主题外观</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="关闭"
                className="text-lg opacity-40 transition-opacity hover:opacity-100"
              >
                ×
              </button>
            </div>
            <p className="mt-1 text-[10px] opacity-50">
              这些设置只保存在你的浏览器里,每位访客都可以有自己的样子。
            </p>

            {/* 主题色调 */}
            <section className="mt-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">主题色调</h3>
                {p.accentH !== null && (
                  <button
                    onClick={() => update({ accentH: null })}
                    className="text-xs text-accent hover:underline"
                  >
                    恢复默认
                  </button>
                )}
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={p.accentH ?? 250}
                onChange={(e) => update({ accentH: Number(e.target.value) })}
                className={`${inputCls} mt-2 h-2 cursor-pointer appearance-none rounded-full`}
                style={{
                  background:
                    "linear-gradient(to right, hsl(0 80% 60%), hsl(60 80% 55%), hsl(120 70% 50%), hsl(180 80% 50%), hsl(240 85% 65%), hsl(300 85% 65%), hsl(360 80% 60%))",
                }}
              />
              <p className="mt-1 text-[10px] opacity-50">
                拖动改变按钮、链接和高亮的主色调。
              </p>
            </section>

            {/* 壁纸模式 */}
            <section className="mt-5">
              <h3 className="font-semibold">壁纸模式</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => update({ wallMode: "wallpaper" })}
                  className={`rounded-lg border px-3 py-2 transition-colors ${
                    p.wallMode === "wallpaper"
                      ? "border-accent bg-accent text-white"
                      : "border-border hover:bg-foreground/10"
                  }`}
                >
                  全屏壁纸
                </button>
                <button
                  onClick={() => update({ wallMode: "plain" })}
                  className={`rounded-lg border px-3 py-2 transition-colors ${
                    p.wallMode === "plain"
                      ? "border-accent bg-accent text-white"
                      : "border-border hover:bg-foreground/10"
                  }`}
                >
                  纯色简洁
                </button>
              </div>
              {p.wallMode === "wallpaper" && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs opacity-70">
                    <span>壁纸虚化强度</span>
                    <span>{wallBlur} px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={wallBlur}
                    onChange={(e) => update({ wallBlur: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
              )}
            </section>

            {/* 壁纸轮播 */}
            <section className="mt-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">🖼️ 壁纸轮播</h3>
                <button
                  onClick={() => update({ wallCarouselOn: !carouselOn })}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    carouselOn ? "bg-accent text-white" : "border border-border opacity-70"
                  }`}
                >
                  {carouselOn ? "轮播中" : "已关闭"}
                </button>
              </div>
              {carouselOn && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs opacity-70">
                    <span>切换间隔</span>
                    <span>{carouselSec} 秒</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={60}
                    value={carouselSec}
                    onChange={(e) => update({ wallCarouselSec: Number(e.target.value) })}
                    className={inputCls}
                  />
                </div>
              )}
              <p className="mt-1 text-[10px] opacity-40">
                范围 = 夜间/白天壁纸 + 壁纸库全部文件。
              </p>
            </section>

            {/* 特效 */}
            <section className="mt-5 space-y-3">
              <h3 className="font-semibold">特效</h3>
              <Toggle
                label="🌸 樱花飘落"
                checked={p.sakura}
                onChange={(checked) => update({ sakura: checked })}
              />
              <Toggle
                label="✨ 首页漂浮粒子"
                checked={p.particles}
                onChange={(checked) => update({ particles: checked })}
              />
            </section>

            {/* 文章布局 */}
            <section className="mt-5">
              <h3 className="mb-2 font-semibold">文章布局</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => update({ articleMode: "grid" })}
                  className={`rounded-lg border px-3 py-2 transition-colors ${
                    p.articleMode === "grid"
                      ? "border-accent bg-accent text-white"
                      : "border-border hover:bg-foreground/10"
                  }`}
                >
                  ▦ 网格
                </button>
                <button
                  onClick={() => update({ articleMode: "list" })}
                  className={`rounded-lg border px-3 py-2 transition-colors ${
                    p.articleMode === "list"
                      ? "border-accent text-white bg-accent"
                      : "border-border hover:bg-foreground/10"
                  }`}
                >
                  ☰ 列表
                </button>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between">
      <span className="opacity-80">{label}</span>
      <span
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-foreground/20"
        }`}
      >
        <span
          className={`inline-block h-4.5 w-4.5 h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-[3px]"
          }`}
        />
      </span>
    </label>
  );
}
