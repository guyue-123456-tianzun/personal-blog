import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "个人站",
    template: "%s · 个人站",
  },
  description: "公开博客 + 私人知识库",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <header className="border-b border-border">
          <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-bold">
              个人站
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="opacity-70 transition-opacity hover:opacity-100">
                首页
              </Link>
              <Link href="/archives" className="opacity-70 transition-opacity hover:opacity-100">
                归档
              </Link>
              <Link href="/about" className="opacity-70 transition-opacity hover:opacity-100">
                关于
              </Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="border-t border-border py-6 text-center text-xs opacity-50">
          个人站 · 公开博客 + 私人知识库 ·{" "}
          <Link href="/login" className="underline hover:opacity-100">
            站长入口
          </Link>
        </footer>
      </body>
    </html>
  );
}
