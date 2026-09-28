import FinanceManager from "@/components/kb/FinanceManager";
import { listFinance } from "@/lib/collections";
import { getSessionUser } from "@/lib/session";

// 记账(C9):收支记录 + 本月汇总。金额在库里以"分"存,页面按元展示
export const dynamic = "force-dynamic";

export const metadata = { title: "记账" };

export default async function KbFinancePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const records = await listFinance(sessionUser);

  // 本月合计:只统计 date 前缀为当前年月的记录
  const month = new Date().toISOString().slice(0, 7);
  let monthIncome = 0;
  let monthExpense = 0;
  for (const record of records) {
    if (!record.date.startsWith(month)) continue;
    if (record.kind === "income") monthIncome += record.amount;
    else monthExpense += record.amount;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">记账</h1>
      <p className="mt-1 text-sm opacity-60">记一笔收支,本月花了多少一眼看清。</p>
      <div className="mt-6">
        <FinanceManager
          initial={records}
          monthIncome={monthIncome}
          monthExpense={monthExpense}
        />
      </div>
    </main>
  );
}
