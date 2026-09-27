"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/kb", label: "仪表盘" },
  { href: "/kb/notes", label: "笔记" },
  { href: "/kb/moments", label: "说说" },
  { href: "/kb/clips", label: "剪藏" },
  { href: "/kb/diary", label: "日记" },
  { href: "/kb/bookmarks", label: "书签" },
  { href: "/kb/paths", label: "路线" },
  { href: "/kb/habits", label: "打卡" },
  { href: "/kb/finance", label: "记账" },
  { href: "/kb/navlinks", label: "导航页" },
  { href: "/kb/timeline", label: "时间线" },
  { href: "/kb/report", label: "周报" },
  { href: "/kb/media", label: "书影音" },
  { href: "/kb/friends", label: "好友" },
  { href: "/kb/appearance", label: "外观" },
  { href: "/kb/ai", label: "AI 助手" },
  { href: "/kb/trash", label: "回收站" },
  { href: "/kb/export", label: "导出" },
];

// 当前页高亮:靠 usePathname 对比路由
export default function KbLinks() {
  const pathname = usePathname();
  return (
    <>
      {LINKS.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(link.href + "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={
              active
                ? "font-medium text-accent"
                : "opacity-70 transition-opacity hover:opacity-100"
            }
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
