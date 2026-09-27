import Link from "next/link";

// 公开区首页:游客可见。M1 里程碑将替换为博客文章列表
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold">个人站</h1>
      <p className="text-lg opacity-70">公开博客 + 私人知识库,正在施工中。</p>
      <div className="rounded-lg border border-border bg-card p-4 text-sm opacity-70">
        <p>当前进度:M0 项目骨架完成 —— 框架、数据库、站长登录已就绪。</p>
        <p>接下来的里程碑:M1 博客公开区 → M2 知识库地基。</p>
      </div>
      <Link
        href="/login"
        className="rounded-lg bg-accent px-5 py-2.5 text-white transition-opacity hover:opacity-90"
      >
        站长登录
      </Link>
    </main>
  );
}
