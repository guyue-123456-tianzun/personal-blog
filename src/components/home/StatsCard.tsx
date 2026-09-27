import RuntimeCounter from "@/components/home/RuntimeCounter";
import type { SiteStats } from "@/lib/site-stats";

type Props = { stats: SiteStats };

// 站点数据卡:行式统计 + 年度进度条(参考站同款"本年还剩 N 天")
export default function StatsCard({ stats }: Props) {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1).getTime();
  const yearPct = Math.round(((now.getTime() - yearStart) / (yearEnd - yearStart)) * 100);
  const daysLeft = Math.ceil((yearEnd - now.getTime()) / 86_400_000);

  const rows = [
    { icon: "📝", label: "文章", value: `${stats.posts} 篇` },
    { icon: "🏷️", label: "标签", value: `${stats.tags} 个` },
    { icon: "✍️", label: "总字数", value: stats.words.toLocaleString() },
    { icon: "📅", label: "今日浏览", value: `${stats.today} 次` },
    { icon: "👁️", label: "总浏览", value: `${stats.views} 次` },
    { icon: "👥", label: "在线访客", value: `${stats.online} 人` },
  ];

  return (
    <section className="glass flex h-full flex-col rounded-2xl p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="inline-block h-4 w-1 rounded-full bg-accent" />
        站点数据
      </h3>
      <ul className="space-y-2.5 text-sm">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between">
            <span className="opacity-70">
              {row.icon} {row.label}
            </span>
            <span className="font-medium">{row.value}</span>
          </li>
        ))}
        <li className="flex items-center justify-between border-t border-border pt-2.5">
          <span className="opacity-70">⏱ 本站已运行</span>
          <RuntimeCounter />
        </li>
      </ul>

      {/* 年度进度条:装饰性但数据真实 */}
      <div className="mt-auto border-t border-border pt-3">
        <div className="flex items-center justify-between text-xs opacity-70">
          <span>🗓 {now.getFullYear()} 年进度</span>
          <span>
            {yearPct}% · 还剩 {daysLeft} 天
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
            style={{ width: `${yearPct}%` }}
          />
        </div>
      </div>
    </section>
  );
}
