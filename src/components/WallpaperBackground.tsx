"use client";

import { useEffect, useState } from "react";

type Props = {
  nightList: string[];
  dayList: string[];
  blur: number;
  siteEnabled: boolean;
  siteSeconds: number;
};

type Prefs = { enabled: boolean; seconds: number };

// 沉浸式壁纸背景(客户端):
// - 夜间/白天两层,跟随主题 CSS 切换
// - 壁纸轮播:按间隔淡入淡出滑到下一张(站长定全站默认,访客可用导航栏 🖼 面板
//   设置只属于自己的偏好,存 localStorage 并通过 wallprefs 事件实时生效)
export default function WallpaperBackground({
  nightList,
  dayList,
  blur,
  siteEnabled,
  siteSeconds,
}: Props) {
  const [prefs, setPrefs] = useState<Prefs>({
    enabled: siteEnabled,
    seconds: siteSeconds,
  });
  const [tick, setTick] = useState(0);

  // 挂载后应用访客本地偏好(覆盖全站默认)
  useEffect(() => {
    try {
      const savedOn = localStorage.getItem("wallCarouselOn");
      const savedSec = Number(localStorage.getItem("wallCarouselSec"));
      setPrefs({
        enabled: savedOn === null ? siteEnabled : savedOn === "1",
        seconds:
          Number.isFinite(savedSec) && savedSec >= 1
            ? Math.min(60, Math.round(savedSec))
            : siteSeconds,
      });
    } catch {
      // 隐私模式等场景 localStorage 可能不可用,回落全站默认
    }
  }, [siteEnabled, siteSeconds]);

  // 壁纸库/点歌台之外的访客面板会派发 wallprefs 事件,实时刷新偏好
  useEffect(() => {
    const handler = () => {
      try {
        const savedOn = localStorage.getItem("wallCarouselOn");
        const savedSec = Number(localStorage.getItem("wallCarouselSec"));
        setPrefs({
          enabled: savedOn === null ? siteEnabled : savedOn === "1",
          seconds:
            Number.isFinite(savedSec) && savedSec >= 1
              ? Math.min(60, Math.round(savedSec))
              : siteSeconds,
        });
      } catch {
        // 同上,忽略
      }
    };
    window.addEventListener("wallprefs", handler);
    return () => window.removeEventListener("wallprefs", handler);
  }, [siteEnabled, siteSeconds]);

  // 轮播计时:到点就走一张;面板上的 ⏭/⏮ 会派发 wallskip 手动跳
  const carouselActive =
    prefs.enabled && (nightList.length > 1 || dayList.length > 1);
  useEffect(() => {
    if (!carouselActive) return;
    const timer = setInterval(
      () => setTick((t) => t + 1),
      Math.max(1, prefs.seconds) * 1000,
    );
    return () => clearInterval(timer);
  }, [carouselActive, prefs.seconds]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<number>).detail ?? 1;
      setTick((t) => t + detail);
    };
    window.addEventListener("wallskip", handler);
    return () => window.removeEventListener("wallskip", handler);
  }, []);

  const nightIndex =
    nightList.length > 0 ? ((tick % nightList.length) + nightList.length) % nightList.length : 0;
  const dayIndex =
    dayList.length > 0 ? ((tick % dayList.length) + dayList.length) % dayList.length : 0;

  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      {/* 白天壁纸层:阳光模式 */}
      <div className="absolute inset-0 dark:hidden">
        <Layer list={dayList} index={dayIndex} blur={blur} />
        <div className="absolute inset-0 bg-background/60" />
      </div>
      {/* 夜间壁纸层:紫色光感模式 */}
      <div className="absolute inset-0 hidden dark:block">
        <Layer list={nightList} index={nightIndex} blur={blur} />
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
