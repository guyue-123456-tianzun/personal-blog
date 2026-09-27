"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/kb", label: "仪表盘" },
  { href: "/kb/notes", label: "笔记" },
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
