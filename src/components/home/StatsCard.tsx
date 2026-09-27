import RuntimeCounter from "@/components/home/RuntimeCounter";
import type { SiteStats } from "@/lib/site-stats";

type Props = { stats: SiteStats };

// 站点数据卡:参考站里最常见的那个小部件
export default function StatsCard({ stats }: Props) {
  const rows = [
    { icon: "📝", label: "文章", value: `${stats.posts} 篇` },
    { icon: "🏷️", label: "标签", value: `${stats.tags} 个` },
    { icon: "✍️", label: "总字数", value: stats.words.toLocaleString() },
    { icon: "📅", label: "今日浏览", value: `${stats.today} 次` },
    { icon: "👁️", label: "总浏览", value: `${stats.views} 次` },
  ];

  return (
    <section className="glass h-full rounded-2xl p-5">
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
    </section>
  );
}
