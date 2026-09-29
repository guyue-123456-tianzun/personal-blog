import MusicPlayer from "@/components/home/MusicPlayer";
import ProfileCard from "@/components/home/ProfileCard";
import StatsCard from "@/components/home/StatsCard";
import TypewriterBanner from "@/components/home/TypewriterBanner";
import TagCloudCard from "@/components/public/TagCloudCard";
import { getAppearance } from "@/lib/settings";
import CalendarWidget from "@/components/home/CalendarWidget";
import CountdownCard from "@/components/home/CountdownCard";
import {
  getMonthViews,
  getSiteStats,
  getTotalVisits,
  recordSiteVisit,
} from "@/lib/site-stats";

type Props = {
  children: React.ReactNode;
  /** 右栏最上面那块(文章页用来放"文章目录");不传就不占位 */
  rightTop?: React.ReactNode;
};

// 公开内容页统一三栏壳(参考站构图):
// 左栏 资料卡+打字机公告+音乐 | 中栏 页面内容 | 右栏 文章目录?+站点统计+分类标签
// 左右两栏往下滑时吸附,滚到自己内容底部就停住;中间内容继续滚。
// 文章详情等页面把内容作为 children 传入。
async function PublicShellLayout({ children, rightTop }: Props) {
  await recordSiteVisit();
  const [stats, appearance, monthViews, totalVisits] = await Promise.all([
    getSiteStats(),
    getAppearance(),
    getMonthViews(),
    getTotalVisits(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-24 sm:px-6">
      <div className="grid items-start gap-4 lg:grid-cols-[250px_minmax(0,1fr)_260px]">
        {/* 左栏:资料 + 打字机公告 + 音乐 + 标签(参考站式信息卡排布) */}
        <div
          className="fade-up space-y-4 lg:sticky lg:top-[72px] lg:self-start"
          style={{ animationDelay: "0ms" }}
        >
          <ProfileCard appearance={appearance} />
          <TypewriterBanner />
          <MusicPlayer playlist={appearance.music} neteasePlaylistId={appearance.neteasePlaylistId} />
          <TagCloudCard />
        </div>

        {/* 中栏:页面内容 */}
        <div className="fade-up min-w-0" style={{ animationDelay: "120ms" }}>
          {children}
        </div>

        {/* 右栏:文章目录(文章页才有) + 站点数据三件套。全部自然高度,无内部滚动条 */}
        <div
          className="fade-up space-y-4 lg:sticky lg:top-[72px] lg:self-start"
          style={{ animationDelay: "240ms" }}
        >
          {rightTop}
          {!rightTop && (
            <>
              <StatsCard stats={stats} totalVisits={totalVisits} />
              <CountdownCard />
              <CalendarWidget monthViews={monthViews} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export const PublicShell = PublicShellLayout;
export default PublicShell;
