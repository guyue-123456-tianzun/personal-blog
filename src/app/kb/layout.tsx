import Link from "next/link";

import KbLinks from "@/components/kb/KbLinks";
import LogoutButton from "@/components/kb/LogoutButton";

// 私有区外壳:顶部一条导航。页面本身受 middleware 保护,这里只管长什么样
export default function KbLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex flex-wrap items-center gap-5 text-sm">
            <Link href="/kb" className="font-bold">
              知识库
            </Link>
            <KbLinks />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="opacity-70 transition-opacity hover:opacity-100">
              回到博客
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
