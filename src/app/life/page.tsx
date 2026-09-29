import Link from "next/link";

import LifeClient from "@/components/public/LifeClient";
import { listFinance, listHabitsWithStreak, listTimeline } from "@/lib/collections";
import { listKbNotes } from "@/lib/kb-content";
import { getSessionUser } from "@/lib/session";
import { PublicShell } from "@/components/public/PublicShell";

// 生活页(2026-09-29 信息架构拍板):习惯打卡 / 记账 / 成长时间线的前台聚合。
// 这些是纯私有数据(表里没有公开字段),所以页面按登录态渲染:
// 登录用户看自己的三块面板,访客看引导卡——不进 middleware 守卫,避免整页 307 打断浏览。
export const dynamic = "force-dynamic";

export const metadata = { title: "生活" };

export default async function LifePage() {
  const user = await getSessionUser();

  return (
    <PublicShell>
      <h1 className="text-2xl font-bold">生活</h1>
      <p className="mt-2 text-sm opacity-60">
        打卡、记账、成长的节点——日子是过出来的,也是记出来的。
      </p>

      {!user ? (
        <div className="glass mt-8 rounded-2xl p-8 text-center">
          <p className="text-3xl">🌙</p>
          <p className="mt-3 text-sm leading-6 opacity-70">
            这里是站主记录日常的地方,内容仅自己可见。
            <br />
            登录之后,你也有属于自己的打卡、账本和时间线。
          </p>
          <Link
            href="/?login=1&next=/life"
            className="mt-4 inline-block rounded-full bg-accent px-6 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            登录 / 注册
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <LifePageData />
        </div>
      )}
    </PublicShell>
  );
}

// 数据取数单独拆一层 async 组件:未登录路径完全不碰数据库
async function LifePageData() {
  const user = await getSessionUser();
  if (!user) return null;

  const [habits, finance, timeline, diaryRows] = await Promise.all([
    listHabitsWithStreak(user),
    listFinance(user),
    listTimeline(user),
    listKbNotes("diary", user),
  ]);

  return (
    <LifeClient
      habits={habits.map((h) => ({
        id: h.id,
        name: h.name,
        streak: h.streak,
        checkedToday: h.checkedToday,
      }))}
      finance={finance.map((r) => ({
        id: r.id,
        kind: r.kind,
        amount: r.amount,
        category: r.category,
        note: r.note,
        date: r.date,
      }))}
      timeline={timeline.map((ev) => ({
        id: ev.id,
        date: ev.date,
        title: ev.title,
        content: ev.content,
      }))}
      diary={diaryRows.map((row) => ({
        id: row.id,
        title: row.title,
        preview: (row.content ?? "").replace(/\s+/g, " ").slice(0, 80),
        updatedAt: row.updatedAt,
      }))}
    />
  );
}
