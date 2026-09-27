import CalendarWidget from "@/components/home/CalendarWidget";
import MusicPlayer from "@/components/home/MusicPlayer";
import ProfileCard from "@/components/home/ProfileCard";
import StatsCard from "@/components/home/StatsCard";
import TypewriterBanner from "@/components/home/TypewriterBanner";
import { getAppearance } from "@/lib/settings";
import { getSiteStats, recordSiteVisit } from "@/lib/site-stats";
import { getSessionUser } from "@/lib/session";

type Props = {
  children: React.ReactNode;
};

// 公开内容页统一三栏壳(参考站构图):
// 左栏 资料卡+打字机公告+音乐 | 中栏 页面内容 | 右栏 站点数据+日历
// 文章详情等页面把内容作为 children 传入。
async function PublicShellLayout({ children }: Props) {
  await recordSiteVisit();
  const [stats, appearance] = await Promise.all([getSiteStats(), getAppearance()]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-8 sm:px-6">
      <div className="grid items-start gap-4 lg:grid-cols-[250px_minmax(0,1fr)_260px]">
        {/* 左栏:资料 + 打字机公告 + 音乐 */}
        <div className="fade-up space-y-4" style={{ animationDelay: "0ms" }}>
          <ProfileCard stats={stats} appearance={appearance} />
          <TypewriterBanner />
          <MusicPlayer playlist={appearance.music} />
        </div>

        {/* 中栏:页面内容 */}
        <div className="fade-up min-w-0" style={{ animationDelay: "120ms" }}>
          {children}
        </div>

        {/* 右栏:站点数据 + 日历 */}
        <div className="fade-up space-y-4" style={{ animationDelay: "240ms" }}>
          <StatsCard stats={stats} />
          <CalendarWidget />
        </div>
      </div>
    </main>
  );
}

export const PublicShell = PublicShellLayout;
export default PublicShell;
