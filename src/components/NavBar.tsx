"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import ThemeDrawer from "@/components/ThemeDrawer";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/", label: "首页", icon: "🏠" },
  { href: "/archives", label: "归档", icon: "📅" },
  { href: "/moments", label: "说说", icon: "💬" },
  { href: "/photos", label: "照片墙", icon: "📷" },
  { href: "/media", label: "书影音", icon: "📚" },
];

// 次要页收进"更多"下拉(参考站也是这个做法:主栏 4~5 项 + 一个下拉)。
// 学习路线/成长时间线/导航页/知识网络以前只能靠直接输网址进,没有任何入口
const MORE = [
  { href: "/network", label: "知识网络" },
  { href: "/paths", label: "学习路线" },
  { href: "/timeline", label: "成长时间线" },
  { href: "/nav", label: "导航页" },
  { href: "/friends", label: "友链" },
  { href: "/about", label: "关于" },
];

type Props = {
  avatar: string;
  siteName: string;
  /** 左上角头像/站名点进去的地址:站长自己的个人主页 */
  profileHref: string;
};

// 顶部导航:三段式——左 头像+站名,中 导航,右 工具图标。
// 视觉上分两种状态:
//   覆盖态(首页、还没往下滚):全透明 + 白字,浮在首屏大图之上,和参考站一样
//   常规态(滚过一点 / 其它页面):毛玻璃底 + 跟随主题的文字色
// 之所以要分两种:首页首屏是深色大图,透明+白字好看;其它页面上方是浅色壁纸,
// 白字会糊掉,所以只有首页才用覆盖态
export default function NavBar({ avatar, siteName, profileHref }: Props) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // 换页面就收起下拉,别让它跟着跑到下一页
  useEffect(() => setMoreOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const overlay = isHome && !scrolled;
  const itemClass = `whitespace-nowrap rounded-full px-2.5 py-1.5 transition-colors ${
    overlay ? "hover:bg-white/15" : "hover:bg-foreground/10"
  }`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        overlay
          ? "border-b border-white/10 bg-transparent"
          : "glass border-b border-border"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        {/* 左:头像 + 站名 → 站长的个人主页 */}
        <Link
          href={profileHref}
          title="进入个人主页"
          className={`flex shrink-0 items-center gap-2 font-bold transition-opacity hover:opacity-80 ${
            overlay ? "text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]" : ""
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar}
            alt=""
            className="h-8 w-8 rounded-xl object-cover ring-1 ring-white/25"
          />
          <span className="hidden sm:inline">{siteName}</span>
        </Link>

        {/* 中:导航。大屏居中;小屏放不下时从左边排起并可横向滑动——
            如果一直用居中对齐,溢出的部分会被挤到屏幕左侧,连"首页"都点不到 */}
        <nav
          className={`flex flex-1 items-center justify-start gap-0.5 overflow-x-auto text-sm [-ms-overflow-style:none] [scrollbar-width:none] lg:justify-center ${
            overlay ? "text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]" : ""
          }`}
        >
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={itemClass}>
              <span className="mr-1 hidden sm:inline">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {/* 更多:收着次要页面,免得主栏越加越长 */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMoreOpen((open) => !open)}
              aria-expanded={moreOpen}
              className={`${itemClass} whitespace-nowrap`}
            >
              更多 {moreOpen ? "⌃" : "⌄"}
            </button>
            {moreOpen && (
              <>
                {/* 点空白处收起 */}
                <button
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setMoreOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className="absolute right-0 z-50 mt-2 w-40 rounded-xl border border-border bg-card p-1.5 text-sm text-foreground shadow-lg backdrop-blur-md">
                  {MORE.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className="block rounded-lg px-2.5 py-1.5 opacity-80 transition-colors hover:bg-foreground/10 hover:opacity-100"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>

        {/* 右:工具图标 */}
        <div
          className={`flex shrink-0 items-center gap-1 ${
            overlay ? "text-white [&_button]:text-white" : ""
          }`}
        >
          <ThemeDrawer />
          <Link
            href="/search"
            aria-label="搜索"
            title="搜索"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              overlay ? "hover:bg-white/15" : "hover:bg-foreground/10"
            }`}
          >
            🔍
          </Link>
          <Link
            href="/kb"
            className={`hidden rounded-full px-2.5 py-1.5 text-sm transition-colors sm:block ${
              overlay ? "hover:bg-white/15" : "hover:bg-foreground/10"
            }`}
          >
            站长入口
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
