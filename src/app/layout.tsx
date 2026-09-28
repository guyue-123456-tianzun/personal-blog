import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

import SiteHeader from "@/components/SiteHeader";
import FloatingMusicButton from "@/components/home/FloatingMusicButton";
import Heartbeat from "@/components/Heartbeat";
import LoginModal from "@/components/LoginModal";
import PetAssistant from "@/components/ai/PetAssistant";
import WallpaperBackground from "@/components/WallpaperBackground";
import { getAiConfig } from "@/lib/ai";
import { getAppearance } from "@/lib/settings";
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
  const aiConfig = await getAiConfig();

  // 背景只用站长在外观后台选定的壁纸。
  // 以前这里把 public\wallpapers\ 整个目录也拼进来当轮播播放列表,结果每 3 秒会在
  // 站长选的那张和库里那个 336MB 的大文件之间来回切,又卡又闪。
  // 壁纸库的用途是"后台一键选用"(见 AppearanceForm),不是自动播放列表
  const nightList = [appearance.wallImage];
  const dayList = [appearance.wallImageDay];

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
        {/* 顶栏是固定定位(fixed),所以内容要留出它的高度;
            首页首屏再用负边距钻回顶栏底下,做成"图从导航下面穿过去"的全出血效果 */}
        <div className="flex-1 pt-14">{children}</div>
        <FloatingMusicButton playlist={appearance.music} />
        <Heartbeat />
        <PetAssistant enabled={aiConfig.enabled} />
        <LoginModal />
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
          <Link href="/settings" className="underline hover:opacity-100">
            设置
          </Link>
        </footer>
      </body>
    </html>
  );
}
