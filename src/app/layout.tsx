import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

import SiteHeader from "@/components/SiteHeader";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        {/* 背景装饰光斑:玻璃卡片靠它才有"透"的感觉 */}
        <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden>
          <div
            className="deco-blob"
            style={{
              width: 480,
              height: 480,
              top: -140,
              left: -100,
              background: "#8b7bff",
            }}
          />
          <div
            className="deco-blob"
            style={{
              width: 420,
              height: 420,
              bottom: -160,
              right: -80,
              background: "#f0abfc",
            }}
          />
          <div
            className="deco-blob"
            style={{
              width: 320,
              height: 320,
              top: "38%",
              left: "56%",
              background: "#67e8f9",
              opacity: 0.3,
            }}
          />
        </div>

        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="glass mt-10 py-5 text-center text-xs opacity-80">
          © {new Date().getFullYear()} {siteConfig.siteName} ·{" "}
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
