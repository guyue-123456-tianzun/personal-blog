import Link from "next/link";

import { siteConfig } from "@/lib/site-config";
import { getAppearance } from "@/lib/settings";
import ThemeDrawer from "@/components/ThemeDrawer";
import ThemeToggle from "@/components/ThemeToggle";

const NAV = [
  { href: "/", label: "首页", icon: "🏠" },
  { href: "/archives", label: "归档", icon: "📅" },
  { href: "/moments", label: "说说", icon: "💬" },
  { href: "/photos", label: "照片墙", icon: "📷" },
  { href: "/media", label: "书影音", icon: "📚" },
  { href: "/friends", label: "友链", icon: "🔗" },
  { href: "/about", label: "关于", icon: "💡" },
];

// 全站顶部导航:玻璃质感,常驻吸顶;小屏时导航条可横向滑动。头像跟随外观设置
export default async function SiteHeader() {
  const appearance = await getAppearance();

  return (
    <header className="glass sticky top-0 z-50 border-x-0 border-t-0">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={appearance.avatar}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
          {siteConfig.siteName}
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm [-ms-overflow-style:none] [scrollbar-width:none]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full px-2.5 py-1.5 transition-colors hover:bg-foreground/10"
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeDrawer />
          <Link
            href="/search"
            aria-label="搜索"
            title="搜索"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-foreground/10"
          >
            🔍
          </Link>
          <Link
            href="/kb"
            className="hidden rounded-full px-2.5 py-1.5 text-sm transition-colors hover:bg-foreground/10 sm:block"
          >
            站长入口
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
