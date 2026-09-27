import Link from "next/link";

import { getPublishedPosts, getTagCloud } from "@/lib/content-api";
import { getSiteStats, recordSiteVisit } from "@/lib/site-stats";
import { getAppearance } from "@/lib/settings";
import { siteConfig } from "@/lib/site-config";

import ProfileCard from "@/components/home/ProfileCard";
import StatsCard from "@/components/home/StatsCard";
import MusicPlayer from "@/components/home/MusicPlayer";
import TypewriterBanner from "@/components/home/TypewriterBanner";
import CalendarWidget from "@/components/home/CalendarWidget";
import ArticleCard from "@/components/home/ArticleCard";
import FloatingMusicButton from "@/components/home/FloatingMusicButton";

// 首页 = 全屏 Hero(大图+签名+搜索,外观后台可调) + 小部件区 + 文章封面卡流
export const dynamic = "force-dynamic";

export default async function Home() {
  // 站点每日浏览计数(支撑站点数据卡的"今日浏览")
  await recordSiteVisit();

  const [posts, tags, stats, appearance] = await Promise.all([
    getPublishedPosts(),
    getTagCloud(),
    getSiteStats(),
    getAppearance(),
  ]);

  return (
    <>
      {/* ===== Hero:首屏即人。图/虚化/高度都在外观设置里可调 ===== */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: `${appearance.heroHeightVh}vh` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={appearance.heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            filter: `blur(${appearance.heroBlur}px)`,
            transform: "scale(1.08)", // 放大一点点,把模糊产生的毛边藏进画框外
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-[var(--background)]" />
        {/* 漂浮粒子:玻璃质感的小点缀 */}
        {[
          { left: "12%", delay: "0s", size: 9 },
          { left: "28%", delay: "2.2s", size: 6 },
          { left: "55%", delay: "1.1s", size: 7 },
          { left: "74%", delay: "3.4s", size: 10 },
          { left: "88%", delay: "0.6s", size: 6 },
        ].map((particle, index) => (
          <span
            key={index}
            className="hero-particle"
            style={{
              left: particle.left,
              width: particle.size,
              height: particle.size,
              animationDelay: particle.delay,
            }}
          />
        ))}
        <div className="relative z-10 mx-auto w-full max-w-2xl px-6 pb-36 text-center text-white">
          <h1 className="text-4xl font-bold drop-shadow-lg sm:text-5xl">
            {siteConfig.siteName}
          </h1>
          <p className="mt-4 text-base opacity-90 drop-shadow sm:text-lg">
            {appearance.signature}
          </p>
          <form
            action="/search"
            method="get"
            className="glass mx-auto mt-8 flex max-w-md items-center rounded-full p-1.5 shadow-lg"
          >
            <input
              name="q"
              placeholder="输入暗号,探索更多…"
              className="w-full bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/60"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              搜索
            </button>
          </form>
          {/* Hero 数据胶囊条:参考站同款,一眼看到站点活跃度 */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 text-sm">
            <span className="glass rounded-full px-4 py-1.5 text-white">
              📝 文章 {posts.length}
            </span>
            <span className="glass rounded-full px-4 py-1.5 text-white">
              👁️ 总浏览 {stats.views}
            </span>
            <span className="glass rounded-full px-4 py-1.5 text-white">
              👥 在线 {stats.online}
            </span>
            <span className="glass rounded-full px-4 py-1.5 text-white">
              📅 运行 {stats.days} 天
            </span>
          </div>
        </div>
      </section>

      {/* 小部件浮上 Hero 底边:参考站的标志构图;入场动画逐个错峰 */}
      <main className="mx-auto w-full max-w-5xl px-4 pb-10 sm:px-6">
        <div className="relative z-20 -mt-24 grid gap-4 md:grid-cols-3">
          <div className="fade-up" style={{ animationDelay: "0ms" }}>
            <ProfileCard stats={stats} appearance={appearance} />
          </div>
          <div className="fade-up" style={{ animationDelay: "120ms" }}>
            <StatsCard stats={stats} />
          </div>
          <div className="fade-up" style={{ animationDelay: "240ms" }}>
            <MusicPlayer />
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <TypewriterBanner />

          {/* 文章流 + 右侧日历 */}
          <div className="grid gap-6 lg:grid-cols-[1fr_270px]">
            <section>
              <h2 className="mb-4 text-xl font-bold">最新文章</h2>
              {posts.length === 0 ? (
                <p className="glass rounded-2xl p-6 text-sm opacity-60">
                  还没有文章。站长登录后写一篇,发布到这里。
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {posts.map((post, index) => (
                    <div
                      key={post.slug}
                      className="fade-up"
                      style={{ animationDelay: `${300 + index * 100}ms` }}
                    >
                      <ArticleCard post={post} />
                    </div>
                  ))}
                </div>
              )}
            </section>
            <aside className="space-y-4">
              <CalendarWidget />
              {tags.length > 0 && (
                <section className="glass rounded-2xl p-5">
                  <h3 className="mb-3 flex items-center gap-2 font-semibold">
                    <span className="inline-block h-4 w-1 rounded-full bg-accent" />
                    标签云
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Link
                        key={tag.name}
                        href={`/tags/${tag.name}`}
                        className="rounded-full border border-border px-2.5 py-1 text-xs transition-colors hover:bg-foreground/10"
                      >
                        {tag.name} · {tag.count}
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
