import { getPublishedPosts, getTagCloud } from "@/lib/content-api";
import { getMonthViews, getSiteStats, getTotalVisits, recordSiteVisit } from "@/lib/site-stats";
import CountdownCard from "@/components/home/CountdownCard";
import { getAppearance } from "@/lib/settings";
import { siteConfig } from "@/lib/site-config";

import ProfileCard from "@/components/home/ProfileCard";
import StatsCard from "@/components/home/StatsCard";
import TypewriterBanner from "@/components/home/TypewriterBanner";
import CalendarWidget from "@/components/home/CalendarWidget";
import MusicPlayer from "@/components/home/MusicPlayer";
import TagCloudCard from "@/components/public/TagCloudCard";
import ArticleBoard from "@/components/home/ArticleBoard";
import LoveCard from "@/components/home/LoveCard";
import WeatherCard from "@/components/home/WeatherCard";

// 首页 = 全屏 Hero + 错落三栏浮层(参考站构图):
//   左栏 资料卡+公告打字机+音乐 | 中栏 文章区(列表/网格切换) | 右栏 站点数据+日历
// 三栏高度各自独立,避免"格子化"的呆板感
export const dynamic = "force-dynamic";

export default async function Home() {
  // 站点每日浏览计数(支撑站点数据卡的"今日浏览")
  await recordSiteVisit();

  const [posts, tags, stats, appearance, monthViews, totalVisits] = await Promise.all([
    getPublishedPosts(),
    getTagCloud(),
    getSiteStats(),
    getAppearance(),
    getMonthViews(),
    getTotalVisits(),
  ]);

  return (
    <>
      {/* ===== Hero:首屏即人。图/虚化/高度都在外观设置里可调 ===== */}      <section
        className="relative -mt-14 flex items-center justify-center overflow-hidden pt-14"
        style={{ minHeight: `calc(${appearance.heroHeightVh}vh + 3.5rem)` }}
      >
        {/* Hero 媒体:夜间/白天各一层,跟随主题切换;下边缘渐隐融进壁纸 */}
        {[
          { theme: "hidden dark:block", src: appearance.heroImage },
          { theme: "dark:hidden", src: appearance.heroImageDay },
        ].map((layer) =>
          /\.(mp4|webm)$/i.test(layer.src) ? (
            <div key={layer.theme} className={`absolute inset-0 ${layer.theme}`}>
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
                style={{
                  filter: `blur(${appearance.heroBlur}px)`,
                  transform: "scale(1.08)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 0%, black 82%, transparent 100%)",
                  maskImage:
                    "linear-gradient(to bottom, black 0%, black 82%, transparent 100%)",
                }}
              >
                <source src={layer.src} />
              </video>
            </div>
          ) : (
            <div key={layer.theme} className={`absolute inset-0 ${layer.theme}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={layer.src}
                alt=""
                className="h-full w-full object-cover"
                style={{
                  filter: `blur(${appearance.heroBlur}px)`,
                  transform: "scale(1.08)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 0%, black 58%, transparent 100%)",
                  maskImage:
                    "linear-gradient(to bottom, black 0%, black 58%, transparent 100%)",
                }}
              />
            </div>
          ),
        )}
        {/* 文字压在图上的暗色渐隐:上浓下淡。壁纸可能是亮的也可能是暗的,
            这层罩子保证任何壁纸下站名/签名/胶囊都读得清 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/10" />
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
        <div className="relative z-10 mx-auto w-full max-w-2xl px-6 pb-20 text-center text-white">
          <h1 className="text-5xl font-bold tracking-wide drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)] sm:text-6xl lg:text-7xl">
            {siteConfig.siteName}
          </h1>
          <p className="mt-4 text-base drop-shadow-[0_1px_10px_rgba(0,0,0,0.75)] sm:text-lg">
            {appearance.signature}
          </p>
          {/* 搜索框/胶囊统一用"深色半透 + 白字",不跟随深浅色主题:
              它们永远压在壁纸上,用玻璃白底会在亮壁纸上变成白字压白底 */}
          <form
            action="/search"
            method="get"
            className="mx-auto mt-8 flex max-w-md items-center rounded-full border border-white/25 bg-black/35 p-1.5 shadow-lg backdrop-blur-md"
          >
            <input
              name="q"
              placeholder="输入暗号,探索更多…"
              className="w-full bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/70"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              搜索
            </button>
          </form>
          {/* Hero 数据胶囊条:一眼看到站点活跃度 */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 text-sm">
            {[
              { icon: "📝", label: "文章", value: posts.length },
              { icon: "👁️", label: "总浏览", value: stats.views },
              { icon: "👥", label: "在线", value: stats.online },
              { icon: "📅", label: "运行", value: `${stats.days} 天` },
            ].map((chip) => (
              <span
                key={chip.label}
                className="rounded-full border border-white/20 bg-black/30 px-4 py-1.5 text-white backdrop-blur-md"
              >
                {chip.icon} {chip.label} {chip.value}
              </span>
            ))}
          </div>
        </div>
        {/* 向下箭头(参考站同款):点一下滚到内容区 */}
        <a
          href="#site-content"
          aria-label="向下滚动查看内容"
          className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 animate-bounce text-2xl text-white/85 transition-colors hover:text-white"
        >
          ⌄
        </a>
      </section>

      {/* ===== 三栏内容区:从全屏 Hero 下方开始(参考站构图,壁纸独占首屏) =====
          左右两栏 sticky:往下滚时跟着走,滚到自己内容的底部就停住不动,
          中间的文章列继续往下滑 */}
      <main id="site-content" className="mx-auto w-full max-w-[1700px] px-4 pb-10 sm:px-6 lg:px-8">
        <div className="relative z-20 grid items-start gap-5 pt-8 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
          {/* 左栏:人物 + 公告 + 恋爱 + 天气。
              音乐卡不在这里——左下角那个浮动圆盘本身就是完整播放器(播放/暂停/自动下一首,
              每页都在),首页再摆一张纯属重复;而且侧栏要能"吸附"就必须比视口矮,
              四张卡已经是这套栅格里装得下的上限 */}
          <div className="fade-up space-y-4 lg:sticky lg:top-[72px] lg:self-start" style={{ animationDelay: "0ms" }}>
            <ProfileCard appearance={appearance} />
            <TypewriterBanner />
            <MusicPlayer playlist={appearance.music} neteasePlaylistId={appearance.neteasePlaylistId} />
            <TagCloudCard />
            <LoveCard
              enabled={appearance.loveEnabled}
              partnerNickname={appearance.lovePartnerNickname}
              partnerAvatar={appearance.lovePartnerAvatar}
              startDate={appearance.loveStartDate}
              myAvatar={appearance.avatar}
            />
            <WeatherCard
              defaultCity={appearance.weatherDefaultCity}
              cities={appearance.weatherCities}
            />
          </div>

          {/* 中栏:文章区(瀑布流/列表切换) */}
          <div className="fade-up" style={{ animationDelay: "120ms" }}>
            <ArticleBoard posts={posts} tags={tags} />
          </div>

          {/* 右栏:站点数据 + 日历(同样吸附) */}
          <div className="fade-up space-y-4 lg:sticky lg:top-[72px] lg:self-start" style={{ animationDelay: "240ms" }}>
            <StatsCard stats={stats} totalVisits={totalVisits} />
            <CountdownCard />
            <CalendarWidget monthViews={monthViews} />
          </div>
        </div>
      </main>
    </>
  );
}
