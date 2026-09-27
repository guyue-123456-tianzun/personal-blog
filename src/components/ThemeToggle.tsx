"use client";

import { useEffect, useState } from "react";

// 深浅色手动切换:切 html 的 .dark 类 + 记进 localStorage(下次打开还认)
export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // 隐私模式下 localStorage 可能不可用,忽略即可(本次会话仍然生效)
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label="切换深浅色模式"
      title="切换深浅色模式"
      className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors hover:bg-foreground/10"
    >
      {/* 挂载前不渲染图标,避免服务端/客户端结果不一致 */}
      {dark === null ? "◐" : dark ? "🌙" : "☀️"}
    </button>
  );
}
