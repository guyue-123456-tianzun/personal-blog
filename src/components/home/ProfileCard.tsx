import Link from "next/link";

import { siteConfig } from "@/lib/site-config";
import type { Appearance } from "@/lib/settings";
import type { SiteStats } from "@/lib/site-stats";

type Props = { stats: SiteStats; appearance: Appearance };

// 社交图标:内置常用类型的矢量图标,未识别的类型用链接图标兜底
function SocialIcon({ type }: { type: string }) {
  const common = "h-4 w-4";
  if (type === "github") {
    return (
      <svg viewBox="0 0 16 16" fill="currentColor" className={common}>
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
    );
  }
  if (type === "mail") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 10 6L22 7" />
      </svg>
    );
  }
  if (type === "rss") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={common}>
        <path d="M4 11a9 9 0 0 1 9 9h3A12 12 0 0 0 4 8v3zm0-7a16 16 0 0 1 16 16h3A19 19 0 0 0 4 1v3zm2 13a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      </svg>
    );
  }
  if (type === "bilibili") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={common}>
        <path d="M17.8 4.6 19 2.6a.6.6 0 0 0-1-.64L16.6 4.1a10.4 10.4 0 0 0-9.2 0L6 1.96a.6.6 0 0 0-1 .64l1.2 2A8.6 8.6 0 0 0 2 12c0 4.6 4.5 8 10 8s10-3.4 10-8a8.6 8.6 0 0 0-4.2-7.4ZM9.5 14.7c-.7 0-1.2-.6-1.2-1.3s.5-1.3 1.2-1.3 1.2.6 1.2 1.3-.5 1.3-1.2 1.3Zm5 0c-.7 0-1.2-.6-1.2-1.3s.5-1.3 1.2-1.3 1.2.6 1.2 1.3-.5 1.3-1.2 1.3Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common}>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}

// 个人资料卡:头像(跟随外观设置) + 签名 + 三个核心数字 + 社交图标
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
      {siteConfig.location && (
        <p className="mt-1 text-xs opacity-50">📍 {siteConfig.location}</p>
      )}

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

      <div className="mt-4 flex justify-center gap-3">
        {siteConfig.socials.map((social) => (
          <Link
            key={social.label}
            href={social.url}
            target="_blank"
            aria-label={social.label}
            title={social.label}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-all hover:-translate-y-0.5 hover:bg-foreground/10"
          >
            <SocialIcon type={social.type} />
          </Link>
        ))}
      </div>
    </section>
  );
}
