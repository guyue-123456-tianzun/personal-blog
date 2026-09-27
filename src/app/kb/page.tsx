import { cookies } from "next/headers";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// 私有区首页:仅站长登录后可见(路由守卫见 src/middleware.ts)
export default async function KbPage() {
  const username = await verifySessionToken(
    (await cookies()).get(SESSION_COOKIE_NAME)?.value,
  );

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">知识库</h1>
        <span className="text-sm opacity-60">站长:{username}</span>
      </header>
      <p className="mt-2 text-sm opacity-60">私有区已就绪,仅你登录后可见。</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { title: "笔记 / 剪藏 / 速记", desc: "M2 知识库地基" },
          { title: "动态 / 日记 / 时间线", desc: "M3 记录模块" },
          { title: "书影音 / 打卡 / 记账 / 导航页", desc: "M3 记录模块" },
          { title: "AI 问答(二期)", desc: "架构已预留接口" },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="font-medium">{item.title}</p>
            <p className="mt-1 text-sm opacity-60">{item.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
