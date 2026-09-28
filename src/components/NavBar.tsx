"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import ThemeDrawer from "@/components/ThemeDrawer";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/archives", label: "归档" },
  { href: "/moments", label: "说说" },
  { href: "/atlas", label: "知识库" },
  { href: "/photos", label: "照片墙" },
  { href: "/media", label: "书影音" },
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

// 顶部导航:悬浮胶囊造型(参考站同款)——
//   离边缘留白、圆角收边、纯文字链接,不再是一条贴边直角长条。
// 视觉两种状态:
//   覆盖态(首页、还没往下滚):全透明 + 白字,浮在首屏大图之上
//   常规态(滚过一点 / 其它页面):毛玻璃胶囊底 + 跟随主题的文字色
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
  const linkClass = `whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${
    overlay ? "hover:bg-white/15" : "hover:bg-foreground/10"
  }`;

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-6">
      {/* 悬浮胶囊:覆盖态全透明浮在大图上;常规态毛玻璃 */}
      <div
        className={`mx-auto flex h-12 max-w-4xl items-center gap-2 rounded-full px-3 shadow-lg transition-all duration-300 sm:px-4 ${
          overlay
            ? "border border-white/10 bg-black/20"
            : "glass"
        }`}
      >
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
            className="h-7 w-7 rounded-full object-cover ring-1 ring-white/25"
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
            <Link key={item.href} href={item.href} className={linkClass}>
              {item.label}
            </Link>
          ))}

          {/* 更多:收着次要页面,免得主栏越加越长 */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMoreOpen((open) => !open)}
              aria-expanded={moreOpen}
              className={`${linkClass} whitespace-nowrap`}
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
          className={`flex shrink-0 items-center gap-0.5 ${
            overlay ? "text-white [&_button]:text-white" : ""
          }`}
        >
          <form
            action="/search"
            className={`hidden items-center rounded-full border px-3 py-1 lg:flex ${
              overlay ? "border-white/30" : "border-border"
            }`}
          >
            <input
              name="q"
              placeholder="搜索"
              className={`w-20 bg-transparent text-xs outline-none xl:w-24 ${
                overlay ? "text-white placeholder:text-white/50" : ""
              }`}
            />
          </form>
          <Link
            href="/search"
            aria-label="搜索"
            title="搜索"
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors lg:hidden ${
              overlay ? "hover:bg-white/15" : "hover:bg-foreground/10"
            }`}
          >
            🔍
          </Link>
          <ThemeDrawer />
          <Link
            href="/search"
            aria-label="搜索"
            title="搜索"
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
              overlay ? "hover:bg-white/15" : "hover:bg-foreground/10"
            }`}
          >
            🔍
          </Link>
          <Link
            href="/kb"
            title="站长入口"
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
