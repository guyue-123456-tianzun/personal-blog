import HabitManager from "@/components/kb/HabitManager";
import { listHabitsWithStreak } from "@/lib/collections";
import { getSessionUser } from "@/lib/session";

// 习惯打卡(C3):添加习惯 + 今日打卡 + 连续天数
export const dynamic = "force-dynamic";

export const metadata = { title: "习惯打卡" };

export default async function KbHabitsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const habits = await listHabitsWithStreak(sessionUser);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">习惯打卡</h1>
      <p className="mt-1 text-sm opacity-60">
        每天点一下,连续天数会自动累加。
      </p>
      <div className="mt-6">
        <HabitManager initial={habits} />
      </div>
    </main>
  );
}
