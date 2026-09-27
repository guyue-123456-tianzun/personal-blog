// 站点个性化配置:改这个文件就能换站名、签名、头像、背景图、歌单、友链……
// 标了 TODO(站长) 的地方等你提供素材;占位内容随时可换,不影响任何功能。

export const siteConfig = {
  /** TODO(站长): 站点名字(也会显示在浏览器标签页) */
  siteName: "个人站",

  /** TODO(站长): 一句话签名,显示在首页 Hero 大标题下面 */
  signature: "把日子过成自己喜欢的样子。",

  /** Hero 背景大图(横图最佳);换成你自己的图:丢进 public/images/ 然后改这里的路径 */
  heroImage: "/images/hero-default.svg",

  /** 头像(方形或圆形均可,显示时会裁圆) */
  avatar: "/images/avatar-default.svg",

  /** 建站日期:站点数据卡的"运行天数"从这里算 */
  siteStartDate: "2026-09-27",

  /** 社交链接(显示在资料卡);不想放的删掉即可 */
  socials: [
    { label: "GitHub", url: "https://github.com/guyue-123456-tianzun" },
  ],

  /** 公告/打字机横幅:轮流播放的句子 */
  announcements: [
    "欢迎来到我的个人站。",
    "这里记录技术与生活。",
    "站点正在逐步建设中……",
  ],

  /**
   * 音乐播放器歌单。两种加歌方式:
   * 1. 把 mp3 放进 public\music\ 目录,url 填 "/music/歌名.mp3"
   * 2. 用任意外链音频地址
   */
  music: [] as { title: string; artist: string; url: string }[],

  /** 友链(显示在 /friends 页) */
  friends: [
    { name: "Next.js", url: "https://nextjs.org", desc: "本站使用的框架" },
    {
      name: "Tailwind CSS",
      url: "https://tailwindcss.com",
      desc: "本站的样式方案",
    },
  ],
} as const;

/** 文章没配封面时,按 slug 稳定地挑一张渐变占位图(同一篇永远同一张) */
export function fallbackCover(slug: string): string {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return `/images/cover-${(hash % 4) + 1}.svg`;
}
