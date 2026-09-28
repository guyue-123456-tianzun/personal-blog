"use client";

import { useEffect, useState } from "react";

import type { TocItem } from "@/lib/toc";

// 文章目录(参考站右栏那块):
// - 点标题直接跳过去(标题自带 scroll-mt,不会被吸顶导航盖住)
// - 往下滚时高亮当前读到的章节
export default function ArticleToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState("");
  const shown = items.filter((item) => item.level >= 2);

  useEffect(() => {
    if (shown.length === 0) return;
    const onScroll = () => {
      // 找出"最后一个已经滚到顶部附近"的标题,就是当前章节
      let current = shown[0].id;
      for (const item of shown) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top <= 110) current = item.id;
      }
      setActiveId(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items, shown]);

  // 文章没有二级/三级标题时不显示空卡片
  if (shown.length === 0) return null;

  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="inline-block h-4 w-1 rounded-full bg-accent" />
        文章目录
      </h3>
      <ul className="space-y-1 text-sm">
        {shown.map((item, index) => {
          const active = activeId === item.id;
          return (
            <li
              key={`${item.id}-${index}`}
              style={{ paddingLeft: item.level >= 3 ? 14 : 0 }}
            >
              <a
                href={`#${item.id}`}
                className={`flex items-baseline gap-2 rounded-lg px-2 py-1 transition-colors ${
                  active
                    ? "bg-accent/15 font-medium text-accent"
                    : "opacity-70 hover:bg-foreground/5 hover:opacity-100"
                }`}
              >
                <span className="shrink-0 text-[10px] opacity-60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="line-clamp-2">{item.text}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
