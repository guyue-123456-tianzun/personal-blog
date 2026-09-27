import RuntimeCounter from "@/components/home/RuntimeCounter";
import type { SiteStats } from "@/lib/site-stats";

type Props = { stats: SiteStats };

// 总浏览量的"万"缩写:9999 以内原样,以上显示 x.xW(参考站风格)
function formatWan(views: number) {
  if (views >= 10000) return `${(views / 10000).toFixed(1)}W`;
  return String(views);
}

// 站点数据卡(参考站构图):行式统计 + 大数字总浏览 + 今日/在线双格 + 年度进度条
export default function StatsCard({ stats }: Props) {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1).getTime();
  const yearPct = Math.round(((now.getTime() - yearStart) / (yearEnd - yearStart)) * 100);
  const daysLeft = Math.ceil((yearEnd - now.getTime()) / 86_400_000);

  return (
    <section className="glass flex h-full flex-col rounded-2xl p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="inline-block h-4 w-1 rounded-full bg-accent" />
        站点统计
      </h3>

      <ul className="space-y-2 text-sm">
        <li className="flex items-center justify-between">
          <span className="opacity-70">📝 文章</span>
          <span className="font-medium">{stats.posts} 篇</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="opacity-70">🏷️ 标签</span>
          <span className="font-medium">{stats.tags} 个</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="opacity-70">✍️ 总字数</span>
          <span className="font-medium">{stats.words.toLocaleString()}</span>
        </li>
      </ul>

      {/* 大数字:总浏览量 */}
      <div className="mt-4 rounded-xl bg-foreground/5 p-3 text-center">
        <p className="text-3xl font-bold tracking-wide">{formatWan(stats.views)}</p>
        <p className="mt-0.5 text-xs opacity-60">总浏览量</p>
      </div>

      {/* 今日/在线 双格 */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-foreground/5 p-2.5">
          <p className="text-lg font-bold">{stats.today}</p>
          <p className="text-xs opacity-60">今日浏览</p>
        </div>
        <div className="rounded-xl bg-foreground/5 p-2.5">
          <p className="text-lg font-bold">{stats.online}</p>
          <p className="text-xs opacity-60">在线访客</p>
        </div>
      </div>

      {/* 运行秒表 */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="opacity-70">⏱ 本站已运行</span>
        <RuntimeCounter />
      </div>

      {/* 年度进度条 */}
      <div className="mt-auto pt-3">
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
