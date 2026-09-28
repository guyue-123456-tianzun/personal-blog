import Link from "next/link";

import { siteConfig } from "@/lib/site-config";
import type { Appearance } from "@/lib/settings";

type Props = { appearance: Appearance };

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

// 个人资料卡:头像 + 站名 + 一条签名 + 社交入口。
// 刻意做减法:文章/标签/运行天数这些数字交给右栏"站点统计",两处不再重复;
// 头像从"小圆头像"改成大号圆角方块,是和站长给的参考卡对齐的视觉重心所在
export default function ProfileCard({ appearance }: Props) {
  return (
    <section className="glass rounded-2xl px-5 py-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={appearance.avatar}
        alt="头像"
        className="mx-auto h-28 w-28 rounded-[26px] object-cover shadow-lg ring-1 ring-white/50"
      />
      <h3 className="mt-4 text-lg font-bold tracking-wide">
        {siteConfig.siteName}
      </h3>
      {/* 名字下的一道短横线:参考卡的固定小细节,作用是给眼睛一个落点 */}
      <span className="mx-auto mt-2 block h-[3px] w-7 rounded-full bg-accent" />
      <p className="mt-2.5 text-sm leading-relaxed opacity-70">
        {appearance.signature}
      </p>
      {siteConfig.location && (
        <p className="mt-2 text-xs opacity-50">📍 {siteConfig.location}</p>
      )}

      {siteConfig.socials.length > 0 && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {siteConfig.socials.map((social) => (
            <Link
              key={social.label}
              href={social.url}
              target="_blank"
              aria-label={social.label}
              title={social.label}
              className="flex items-center gap-1.5 rounded-xl bg-foreground/5 px-3 py-2 text-xs opacity-80 transition-all hover:-translate-y-0.5 hover:bg-accent hover:text-white hover:opacity-100"
            >
              <SocialIcon type={social.type} />
              {social.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
