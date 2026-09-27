"use client";

import { useEffect, useState } from "react";

import { siteConfig } from "@/lib/site-config";

// 运行时长(精确到秒):参考站里那个"本站已运行 34天3小时45分32秒"
export default function RuntimeCounter() {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  let text = "…";
  if (now !== null) {
    let seconds = Math.max(0, Math.floor((now - new Date(siteConfig.siteStartDate).getTime()) / 1000));
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    text = `${days}天${hours}时${minutes}分${secs}秒`;
  }

  return <span className="font-mono text-xs">{text}</span>;
}
