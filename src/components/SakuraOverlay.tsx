"use client";

import { useEffect, useState } from "react";

import { readThemePrefs, THEME_PREFS_EVENT } from "@/lib/theme-prefs";

// 樱花飘落特效:访客可在主题面板开关(默认开)。
// 纯 CSS 动画,不挡任何点击。
export default function SakuraOverlay() {
  const [sakura, setSakura] = useState(true);

  useEffect(() => {
    const sync = () => setSakura(readThemePrefs().sakura);
    sync();
    window.addEventListener(THEME_PREFS_EVENT, sync);
    return () => window.removeEventListener(THEME_PREFS_EVENT, sync);
  }, []);

  if (!sakura) return null;

  const petals = Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 7.3 + 4) % 100}%`,
    duration: `${7 + ((i * 1.7) % 6)}s`,
    delay: `${(i * 0.9) % 8}s`,
    size: 10 + ((i * 3) % 8),
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden>
      {petals.map((petal, index) => (
        <span
          key={index}
          className="sakura-petal"
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size,
            animationDuration: petal.duration,
            animationDelay: petal.delay,
          }}
        />
      ))}
    </div>
  );
}
