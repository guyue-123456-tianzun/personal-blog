import NavBar from "@/components/NavBar";
import { getSessionUser } from "@/lib/session";
import { getAppearance } from "@/lib/settings";
import { siteConfig } from "@/lib/site-config";
import { getAdminUser } from "@/lib/users";

// 全站顶部导航(服务端取数 → 交给客户端组件渲染交互):
// 透明悬浮的三段式导航条,头像/站名点进去是站长的个人主页
export default async function SiteHeader() {
  const [appearance, admin, user] = await Promise.all([
    getAppearance(),
    getAdminUser(),
    getSessionUser(),
  ]);

  return (
    <NavBar
      avatar={appearance.avatar}
      siteName={siteConfig.siteName}
      playlist={appearance.music}
      neteasePlaylistId={appearance.neteasePlaylistId}
      // 站长账号缺失(全新库)时退回首页,别让图标点了没反应
      profileHref={admin ? `/u/${encodeURIComponent(admin.username)}` : "/"}
      sessionUsername={user?.username ?? null}
    />
  );
}
