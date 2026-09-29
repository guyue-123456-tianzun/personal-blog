"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import NavMusic from "@/components/NavMusic";
import ThemeToggle from "@/components/ThemeToggle";
import { type Song } from "@/lib/music";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/archives", label: "归档" },
  { href: "/moments", label: "说说" },
  { href: "/atlas", label: "知识库" },
  { href: "/photos", label: "照片墙" },
  { href: "/media", label: "书影音" },
  { href: "/life", label: "生活" },
];

// 次要页收进"更多"下拉(参考站也是这个做法:主栏 4~5 项 + 一个下拉)。
// 学习路线/成长时间线/导航页/知识网络以前只能靠直接输网址进,没有任何入口
const MORE = [
  { href: "/buddies", label: "我的好友" },
  { href: "/network", label: "知识网络" },
  { href: "/paths", label: "学习路线" },
  { href: "/timeline", label: "成长时间线" },
  { href: "/nav", label: "导航页" },
  { href: "/friends", label: "友链" },
  { href: "/about", label: "关于" },
];

// 简约线条小图标(参考站同款风格),currentColor 跟随文字色
const ICONS: Record<string, React.ReactNode> = {
  "/": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  "/archives": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  ),
  "/moments": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  "/atlas": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  "/photos": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  ),
  "/media": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 3v18M17 3v18M3 8h18M3 16h18" />
    </svg>
  ),
  "/life": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),
};

type Props = {
  avatar: string;
  siteName: string;
  /** 左上角头像/站名点进去的地址:站长自己的个人主页 */
  profileHref: string;
  playlist: Song[];
  neteasePlaylistId: string | null;
  /** 当前登录用户;null = 访客(更多菜单里给登录/注册入口) */
  sessionUsername: string | null;
};

// 顶部导航:悬浮胶囊(参考站同款)——
//   离边缘留白、圆角收边、半透明毛玻璃、纯文字+简约小图标、搜索框嵌入。
// 视觉两种状态:
//   覆盖态(首页、还没往下滚):全透明 + 白字,浮在首屏大图之上
//   常规态(滚过一点 / 其它页面):半透明毛玻璃 + 跟随主题的文字色
export default function NavBar({
  avatar,
  siteName,
  profileHref,
  playlist,
  neteasePlaylistId,
  sessionUsername,
}: Props) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const musicRef = useRef<HTMLDivElement | null>(null);

  // 换页面就收起下拉,别让它跟着跑到下一页
  useEffect(() => {
    setMoreOpen(false);
    setMusicOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 点面板外部收起音乐面板
  useEffect(() => {
    if (!musicOpen) return;
    const onClick = (e: MouseEvent) => {
      if (musicRef.current && !musicRef.current.contains(e.target as Node)) {
        setMusicOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [musicOpen]);

  // /atlas 整页就是深空背景,浅色胶囊浮在上面像条黑带——
  // 沿用首页覆盖态的透明白字样式,导航就"长"在星空里了
  const isAtlas = pathname.startsWith("/atlas");
  const overlay = (isHome && !scrolled) || isAtlas;
  const itemClass = `whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] transition-colors ${
    overlay ? "hover:bg-white/15" : "hover:bg-foreground/10"
  }`;

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-6">
      {/* 悬浮胶囊:覆盖态全透明浮在大图上;常规态半透明毛玻璃(比旧版更透) */}
      <div
        className={`mx-auto flex h-14 max-w-6xl items-center gap-3 rounded-full px-5 shadow-lg transition-all duration-300 sm:px-6 ${
          overlay
            ? "border border-white/10 bg-black/20"
            : "border border-white/25 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/10"
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
            <Link key={item.href} href={item.href} className={itemClass}>
              <span className="mr-1 inline-block align-[-2px]">
                {ICONS[item.href]}
              </span>
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
                <div className="absolute right-0 z-50 mt-2 w-40 rounded-xl border border-white/15 bg-[#181830]/95 p-1.5 text-sm text-foreground shadow-2xl backdrop-blur-2xl">
                  {(sessionUsername
                    ? [
                        {
                          href: `/u/${encodeURIComponent(sessionUsername)}`,
                          label: "我的主页",
                        },
                        { href: "/atlas", label: "知识库工作台" },
                        ...MORE,
                      ]
                    : [
                        { href: "/?login=1", label: "登录 / 注册" },
                        ...MORE,
                      ]
                  ).map((item) => (
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

        {/* 右:搜索框(参考站同款,嵌在胶囊里) + ♀音乐点歌 + 工具 */}
        <div
          className={`flex shrink-0 items-center gap-1 ${
            overlay ? "text-white [&_button]:text-white" : ""
          }`}
        >
          {/* 大屏:搜索输入框直接嵌在胶囊里;小屏收成图标 */}
          <form
            action="/search"
            className={`hidden items-center rounded-full border px-3 py-1 lg:flex ${
              overlay ? "border-white/30" : "border-border"
            }`}
          >
            <input
              name="q"
              placeholder="搜索"
              className={`w-28 bg-transparent text-xs outline-none xl:w-36 ${
                overlay ? "text-white placeholder:text-white/50" : "placeholder:opacity-50"
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
          <NavMusic
            playlist={playlist}
            neteasePlaylistId={neteasePlaylistId}
            overlay={overlay}
          />
          <Link
            href="/settings"
            title="外观 / AI / 备份 / 账号"
            className={`hidden rounded-full px-2.5 py-1.5 text-sm transition-colors sm:block ${
              overlay ? "hover:bg-white/15" : "hover:bg-foreground/10"
            }`}
          >
            设置
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
