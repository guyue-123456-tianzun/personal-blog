import RuntimeCounter from "@/components/home/RuntimeCounter";
import type { SiteStats } from "@/lib/site-stats";

type Props = { stats: SiteStats; totalVisits: number };

// 总浏览量的"万"缩写:9999 以内原样,以上显示 x.xW(参考站风格)
function formatWan(views: number) {
  if (views >= 10000) return `${(views / 10000).toFixed(1)}W`;
  return String(views);
}

// 站点数据卡(Sigrika 行式 + DreamStory 大数字):
// 彩色图标行 → 大数字总浏览 → 今日/在线双格 → 运行秒表 → 年度进度条
export default function StatsCard({ stats, totalVisits }: Props) {
  const now = new Date();

  // 年/月/周/日 四条时间进度(参考站同款):每条 = 区间起止 + "还剩 X"
  const spans = [
    { label: `${now.getFullYear()} 年进度`, start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1), unit: "天" },
    { label: "本月进度", start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 1), unit: "天" },
    // 周从周一算起
    { label: "本周进度", start: (() => { const d = new Date(now); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); d.setHours(0, 0, 0, 0); return d; })(), end: (() => { const d = new Date(now); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 7); d.setHours(0, 0, 0, 0); return d; })(), unit: "天" },
    { label: "今日进度", start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), unit: "小时" },
  ].map((s) => {
    const pct = Math.min(100, Math.max(0, Math.round(((now.getTime() - s.start.getTime()) / (s.end.getTime() - s.start.getTime())) * 100)));
    const leftMs = s.end.getTime() - now.getTime();
    const left = s.unit === "小时" ? Math.max(0, Math.floor(leftMs / 3_600_000)) : Math.max(1, Math.ceil(leftMs / 86_400_000));
    return { ...s, pct, left };
  });

  // 只留"别处没有的数字":文章/标签/总字数 + 运行时长。
  // 全站浏览交给下面的大数字、今日浏览交给双格,避免同一张卡里自己重复自己
  const rows = [
    { icon: "📝", tone: "bg-blue-500/15 text-blue-500", label: "文章", value: `${stats.posts} 篇` },
    { icon: "🏷️", tone: "bg-violet-500/15 text-violet-500", label: "标签", value: `${stats.tags} 个` },
    { icon: "✍️", tone: "bg-pink-500/15 text-pink-500", label: "总字数", value: stats.words.toLocaleString() },
  ];

  return (
    <section className="glass flex h-full flex-col rounded-2xl p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="inline-block h-4 w-1 rounded-full bg-accent" />
        站点统计
      </h3>

      <ul className="space-y-2.5 text-sm">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm ${row.tone}`}
              >
                {row.icon}
              </span>
              <span className="opacity-75">{row.label}</span>
            </span>
            <span className="font-medium">{row.value}</span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <span className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-sm text-emerald-500">
              ⏱
            </span>
            <span className="opacity-75">本站已运行</span>
          </span>
          <RuntimeCounter />
        </li>
      </ul>

      {/* 大数字:总浏览量 */}
      <div className="mt-4 rounded-xl bg-foreground/5 p-3 text-center">
        <p className="text-3xl font-bold tracking-wide">{formatWan(stats.views)}</p>
        <p className="mt-0.5 text-xs opacity-60">总浏览量</p>
      </div>

      {/* 今日/在线 双格 */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-foreground/5 p-2.5">
          <p className="text-lg font-bold">{stats.today}</p>
          <p className="text-xs opacity-60">今日浏览</p>
        </div>
        <div className="rounded-xl bg-foreground/5 p-2.5">
          <p className="text-lg font-bold">{stats.online}</p>
          <p className="text-xs opacity-60">在线访客</p>
        </div>
      </div>

      {/* 访客序号(参考站同款):累计访问次数,粗粒度但诚实 */}
      <p className="mt-3 text-center text-xs opacity-60">
        🏠 您是本站第 <b className="text-accent">{totalVisits.toLocaleString()}</b> 位访客
      </p>

      {/* 年/月/周/日 四条时间进度 */}
      <div className="mt-auto space-y-2 pt-3">
        {spans.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>{s.label}</span>
              <span>
                {s.pct}% · 还剩 {s.left} {s.unit}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
