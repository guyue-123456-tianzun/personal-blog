"use client";

import { useEffect } from "react";

// 心跳:页面打开期间每 45 秒向后端报一次到,支撑站点数据卡的"在线访客"。
// 静默运行,失败不影响页面。
export default function Heartbeat() {
  useEffect(() => {
    const beat = () => {
      fetch("/api/heartbeat", { method: "POST" }).catch(() => {});
    };
    beat();
    const timer = setInterval(beat, 45_000);
    return () => clearInterval(timer);
  }, []);

  return null;
}
