import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

import SiteHeader from "@/components/SiteHeader";
import FloatingMusicButton from "@/components/home/FloatingMusicButton";
import Heartbeat from "@/components/Heartbeat";
import WallpaperBackground from "@/components/WallpaperBackground";
import { getAppearance, getWallLibrary } from "@/lib/settings";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: {
    default: siteConfig.siteName,
    template: `%s · ${siteConfig.siteName}`,
  },
  description: siteConfig.signature,
};

// 首帧防闪烁:在页面渲染前根据"上次选择 → 系统偏好"给 html 挂上 .dark
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}`;

// 沉浸式布局:整站背景 = 壁纸图(可换/可调虚化),所有玻璃卡片浮在它上面。
// 这是对齐参考站观感的关键:玻璃"透"的是真实的图,而不是纯色。
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appearance = await getAppearance();

  // 轮播列表:当前设置的夜间/白天壁纸 + 壁纸库(public\wallpapers\)里的全部文件,去重
  const library = getWallLibrary();
  const nightList = [...new Set([appearance.wallImage, ...library])];
  const dayList = [...new Set([appearance.wallImageDay, ...library])];

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        {/* 沉浸式壁纸:夜间/白天各一层 + 轮播(站长定默认,访客在导航栏 🖼️ 调自己的) */}
        <WallpaperBackground
          nightList={nightList}
          dayList={dayList}
          blur={appearance.wallBlur}
          siteEnabled={appearance.wallCarouselEnabled}
          siteSeconds={appearance.wallCarouselSeconds}
        />

        <SiteHeader />
        <div className="flex-1">{children}</div>
        <FloatingMusicButton playlist={appearance.music} />
        <Heartbeat />
        <footer className="glass mt-10 py-5 text-center text-xs opacity-80">
          © {new Date().getFullYear()} {siteConfig.siteName} ·{" "}
          <Link href="/feed.xml" className="underline hover:opacity-100">
            RSS
          </Link>{" "}
          ·{" "}
          <Link href="/friends" className="underline hover:opacity-100">
            友链
          </Link>{" "}
          ·{" "}
          <Link href="/kb" className="underline hover:opacity-100">
            站长入口
          </Link>
        </footer>
      </body>
    </html>
  );
}
