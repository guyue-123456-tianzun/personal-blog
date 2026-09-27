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

// 首页 = 全屏 Hero + 三栏浮层(参考站构图):
//   左栏 资料卡+音乐 | 中栏 文章卡流 | 右栏 站点数据+日历,整体压在 Hero 下沿上
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
        {/\.(mp4|webm)$/i.test(appearance.heroImage) ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              filter: `blur(${appearance.heroBlur}px)`,
              transform: "scale(1.08)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 58%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 58%, transparent 100%)",
            }}
          >
            <source src={appearance.heroImage} />
          </video>
        ) : (
          <img
            src={appearance.heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              filter: `blur(${appearance.heroBlur}px)`,
              transform: "scale(1.08)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 58%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 58%, transparent 100%)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />
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

      {/* ===== 三栏浮层:压在 Hero 下沿(参考站构图) ===== */}
      <main className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <div className="relative z-20 -mt-24">
          <TypewriterBanner />

          <div className="mt-4 grid items-start gap-4 lg:grid-cols-[250px_1fr_260px]">
            {/* 左栏:资料 + 音乐 */}
            <div className="fade-up space-y-4" style={{ animationDelay: "0ms" }}>
              <ProfileCard stats={stats} appearance={appearance} />
              <MusicPlayer playlist={appearance.music} />
            </div>

            {/* 中栏:文章卡流 */}
            <div className="fade-up glass rounded-2xl p-5" style={{ animationDelay: "120ms" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">最新文章</h2>
                <span className="text-xs opacity-50">共 {posts.length} 篇</span>
              </div>
              {posts.length === 0 ? (
                <p className="mt-4 text-sm opacity-60">
                  还没有文章。站长登录后写一篇,发布到这里。
                </p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {posts.map((post, index) => (
                    <div
                      key={post.slug}
                      className="fade-up"
                      style={{ animationDelay: `${200 + index * 100}ms` }}
                    >
                      <ArticleCard post={post} />
                    </div>
                  ))}
                </div>
              )}
              {tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
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
              )}
            </div>

            {/* 右栏:站点数据 + 日历 */}
            <div className="fade-up space-y-4" style={{ animationDelay: "240ms" }}>
              <StatsCard stats={stats} />
              <CalendarWidget />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
