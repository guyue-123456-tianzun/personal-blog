// RSS 订阅源生成:标准 RSS 2.0,阅读器可直接订阅
import { siteConfig } from "./site-config";

export type RssItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string | null;
};

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildRssXml(posts: RssItem[]): string {
  const siteUrl = siteConfig.siteUrl.replace(/\/$/, "");
  const link = (slug: string) => `${siteUrl}/posts/${slug}`;

  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link(post.slug)}</link>
      <guid>${link(post.slug)}</guid>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date().toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt ?? "")}</description>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteConfig.siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteConfig.signature)}</description>
    <language>zh-CN</language>
${items}
  </channel>
</rss>`;
}
