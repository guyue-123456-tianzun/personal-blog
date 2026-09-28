"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// 后台导航:按"写作 / 知识 / 记录 / 站点 / 系统"分组。
// 以前是顶部一排 19 个入口平铺,越长越挤、也看不出哪块归哪块。
// 带 publicHref 的条目说明前台有对应页面,右侧给一个 ↗ 直接去看访客看到的样子。
type Item = {
  href: string;
  label: string;
  icon: string;
  /** 前台对应页面;有就显示 ↗ 出口 */
  publicHref?: string;
};

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "写作",
    items: [
      { href: "/kb", label: "仪表盘", icon: "🏠" },
      { href: "/kb/notes", label: "笔记", icon: "📝" },
      { href: "/kb/clips", label: "剪藏", icon: "✂️" },
      { href: "/kb/diary", label: "日记", icon: "🔒" },
      { href: "/kb/moments", label: "说说", icon: "💬", publicHref: "/moments" },
    ],
  },
  {
    title: "知识",
    items: [
      { href: "/kb/graph", label: "知识图谱", icon: "🕸️", publicHref: "/network" },
      { href: "/kb/bookmarks", label: "书签", icon: "🔖" },
      { href: "/kb/paths", label: "学习路线", icon: "🧭", publicHref: "/paths" },
      { href: "/kb/navlinks", label: "导航页", icon: "🧩", publicHref: "/nav" },
    ],
  },
  {
    title: "记录",
    items: [
      { href: "/kb/media", label: "书影音", icon: "📚", publicHref: "/media" },
      { href: "/kb/habits", label: "习惯打卡", icon: "🔥" },
      { href: "/kb/finance", label: "记账", icon: "💰" },
      { href: "/kb/timeline", label: "成长时间线", icon: "🌱", publicHref: "/timeline" },
    ],
  },
  {
    title: "站点",
    items: [
      { href: "/kb/appearance", label: "外观设置", icon: "🎨" },
      { href: "/kb/ai", label: "AI 助手", icon: "🤖" },
      { href: "/kb/report", label: "周报", icon: "📅" },
      { href: "/kb/friends", label: "好友", icon: "👥" },
    ],
  },
  {
    title: "系统",
    items: [
      { href: "/kb/trash", label: "回收站", icon: "🗑️" },
      { href: "/kb/export", label: "导出", icon: "📦" },
    ],
  },
];

// variant:
//   sidebar —— 大屏左侧竖排(默认)
//   drawer  —— 小屏收在折叠菜单里
export default function KbLinks({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "drawer";
}) {
  const pathname = usePathname();

  const groups = GROUPS.map((group) => (
    <div
      key={group.title}
      className={variant === "sidebar" ? "mt-3 first:mt-2" : "mt-3 first:mt-1"}
    >
      <p className="mb-1 px-2 text-[11px] font-medium tracking-wider opacity-45">
        {group.title}
      </p>
      <ul className="space-y-px">
        {group.items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/kb" && pathname.startsWith(item.href + "/"));
          return (
            <li key={item.href} className="flex items-center gap-0.5">
              <Link
                href={item.href}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors ${
                  active
                    ? "bg-accent/15 font-medium text-accent"
                    : "opacity-75 hover:bg-foreground/5 hover:opacity-100"
                }`}
              >
                <span className="shrink-0 text-[13px]">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
              {item.publicHref && (
                <Link
                  href={item.publicHref}
                  title="去前台看访客的样子"
                  aria-label={`去前台看${item.label}`}
                  className="shrink-0 rounded-md px-1.5 py-1 text-xs opacity-35 transition-opacity hover:bg-foreground/5 hover:opacity-90"
                >
                  ↗
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  ));

  if (variant === "drawer") {
    return <div className="pb-2">{groups}</div>;
  }
  return <nav>{groups}</nav>;
}
