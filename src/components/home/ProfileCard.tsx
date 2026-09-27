import Link from "next/link";

import { siteConfig } from "@/lib/site-config";
import type { Appearance } from "@/lib/settings";
import type { SiteStats } from "@/lib/site-stats";

type Props = { stats: SiteStats; appearance: Appearance };

// 个人资料卡:头像 + 昵称 + 签名 + 社交链接 + 三个核心数字(头像/签名跟随外观设置)
export default function ProfileCard({ stats, appearance }: Props) {
  return (
    <section className="glass flex h-full flex-col items-center rounded-2xl p-5 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={appearance.avatar}
        alt="头像"
        className="h-20 w-20 rounded-full border-2 border-white/40 object-cover shadow-lg"
      />
      <h3 className="mt-3 text-lg font-bold">{siteConfig.siteName}</h3>
      <p className="mt-1 text-sm opacity-70">{appearance.signature}</p>

      <div className="mt-4 flex w-full justify-center gap-8">
        <div>
          <p className="text-xl font-bold text-accent">{stats.posts}</p>
          <p className="text-xs opacity-60">文章</p>
        </div>
        <div>
          <p className="text-xl font-bold text-accent">{stats.tags}</p>
          <p className="text-xs opacity-60">标签</p>
        </div>
        <div>
          <p className="text-xl font-bold text-accent">{stats.days}</p>
          <p className="text-xs opacity-60">运行天数</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {siteConfig.socials.map((social) => (
          <Link
            key={social.label}
            href={social.url}
            target="_blank"
            className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-foreground/10"
          >
            {social.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
