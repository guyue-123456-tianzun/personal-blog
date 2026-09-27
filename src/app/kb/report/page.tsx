import { buildWeeklyReport } from "@/lib/report";
import { getSessionUser } from "@/lib/session";

// 周报(C5):自动汇总最近 7 天
export const dynamic = "force-dynamic";

export const metadata = { title: "周报" };

export default async function KbReportPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const report = await buildWeeklyReport(sessionUser);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">周报</h1>
      <p className="mt-1 text-sm opacity-60">
        {report.weekStart} ~ {report.weekEnd} 自动汇总。
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "新笔记", value: report.noteCount },
          { label: "新动态", value: report.momentCount },
          { label: "日记", value: report.diaryCount },
          { label: "写下字数", value: report.wordsWritten },
        ].map((card) => (
          <div key={card.label} className="glass rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="mt-0.5 text-xs opacity-60">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="glass mt-6 rounded-2xl p-5">
        <h2 className="font-semibold">这周写下的内容</h2>
        {report.items.length === 0 ? (
          <p className="mt-3 text-sm opacity-60">这周还没有新的记录。</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {report.items.map((item, index) => (
              <li key={index} className="flex items-center justify-between gap-3">
                <span className="truncate">
                  <span className="mr-2 rounded-full border border-border px-2 py-0.5 text-xs opacity-60">
                    {item.type}
                  </span>
                  {item.title}
                </span>
                <span className="shrink-0 text-xs opacity-50">{item.date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
