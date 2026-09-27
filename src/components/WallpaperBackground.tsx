"use client";

import { useEffect, useState } from "react";

import {
  readThemePrefs,
  THEME_PREFS_EVENT,
  type ThemePrefs,
} from "@/lib/theme-prefs";

type Props = {
  nightList: string[];
  dayList: string[];
  blur: number;
  siteEnabled: boolean;
  siteSeconds: number;
};

// 沉浸式壁纸背景(客户端):
// - 夜间/白天两层,跟随主题 CSS 切换
// - 壁纸轮播:按间隔淡入淡出滑到下一张(站长定全站默认,访客在主题面板设个人偏好)
// - 访客可选"纯色简洁"模式隐藏壁纸
export default function WallpaperBackground({
  nightList,
  dayList,
  blur,
  siteEnabled,
  siteSeconds,
}: Props) {
  const [prefs, setPrefs] = useState<ThemePrefs | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const sync = () => setPrefs(readThemePrefs());
    sync();
    window.addEventListener(THEME_PREFS_EVENT, sync);
    return () => window.removeEventListener(THEME_PREFS_EVENT, sync);
  }, []);

  const carouselOn = prefs?.wallCarouselOn ?? siteEnabled;
  const seconds = prefs?.wallCarouselSec ?? siteSeconds;
  const blurOverride = prefs?.wallBlur ?? blur;
  const plain = prefs?.wallMode === "plain";

  const carouselActive =
    !plain && carouselOn && (nightList.length > 1 || dayList.length > 1);
  useEffect(() => {
    if (!carouselActive) return;
    const timer = setInterval(
      () => setTick((t) => t + 1),
      Math.max(1, seconds) * 1000,
    );
    return () => clearInterval(timer);
  }, [carouselActive, seconds]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail ?? 1;
      setTick((t) => t + detail);
    };
    window.addEventListener("wallskip", handler);
    return () => window.removeEventListener("wallskip", handler);
  }, []);

  const nightIndex =
    nightList.length > 0
      ? ((tick % nightList.length) + nightList.length) % nightList.length
      : 0;
  const dayIndex =
    dayList.length > 0
      ? ((tick % dayList.length) + dayList.length) % dayList.length
      : 0;

  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      {/* 白天壁纸层:阳光模式 */}
      <div className="absolute inset-0 dark:hidden">
        {!plain && <Layer list={dayList} index={dayIndex} blur={blurOverride} />}
        <div className="absolute inset-0 bg-background/60" />
      </div>
      {/* 夜间壁纸层:紫色光感模式 */}
      <div className="absolute inset-0 hidden dark:block">
        {!plain && <Layer list={nightList} index={nightIndex} blur={blurOverride} />}
        <div className="absolute inset-0 bg-[#07070f]/75" />
      </div>
    </div>
  );
}

// 单层壁纸:列表全部渲染,图片用透明度过渡实现"滑动到下一张"的柔滑切换;
// 视频只挂载当前这张,避免多路视频同时播放
function Layer({
  list,
  index,
  blur,
}: {
  list: string[];
  index: number;
  blur: number;
}) {
  return (
    <div className="absolute inset-0">
      {list.map((src, i) => {
        const mediaStyle = {
          filter: `blur(${blur}px)`,
          transform: "scale(1.1)",
        };
        if (/\.(mp4|webm)$/i.test(src)) {
          if (i !== index) return null;
          return (
            <video
              key={src}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
              style={mediaStyle}
            >
              <source src={src} />
            </video>
          );
        }
        return (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={src}
            src={src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            style={mediaStyle}
          />
        );
      })}
    </div>
  );
}
