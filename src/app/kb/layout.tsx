import Link from "next/link";

import KbLinks from "@/components/kb/KbLinks";
import LogoutButton from "@/components/kb/LogoutButton";

// 私有区外壳:大屏是左侧分组导航 + 右侧内容(参考站那种两栏);
// 小屏把整份菜单收进一个折叠条,免得像以前那样一排挤成横条。
// 页面本身受 middleware 保护,这里只管长什么样
export default function KbLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
      {/* 大屏:左侧固定侧栏,跟着页面吸附 */}
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="glass sticky top-[72px] max-h-[calc(100vh-88px)] overflow-y-auto rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2 pb-1">
            <Link href="/kb" className="font-bold">
              知识库
            </Link>
            <LogoutButton />
          </div>
          <KbLinks />
          <Link
            href="/"
            className="mt-3 block rounded-lg px-2 py-1.5 text-sm opacity-60 transition-opacity hover:bg-foreground/5 hover:opacity-100"
          >
            ← 回到博客
          </Link>
        </div>
      </aside>

      {/* 小屏:折叠菜单 */}
      <div className="min-w-0 flex-1">
        <details className="glass mb-4 rounded-2xl px-4 py-3 lg:hidden">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
            <span>知识库菜单</span>
            <span className="text-xs opacity-50">点开</span>
          </summary>
          <KbLinks variant="drawer" />
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
            <Link href="/" className="opacity-60 transition-opacity hover:opacity-100">
              ← 回到博客
            </Link>
            <LogoutButton />
          </div>
        </details>
        {children}
      </div>
    </div>
  );
}
