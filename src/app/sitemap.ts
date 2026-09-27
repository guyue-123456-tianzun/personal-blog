import type { MetadataRoute } from "next";

import { getPublishedPosts } from "@/lib/content-api";
import { siteConfig } from "@/lib/site-config";

// sitemap:给搜索引擎指路。域名下来后在 site-config 填 siteUrl 即生成绝对地址
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const posts = await getPublishedPosts();

  const staticPages = ["", "/archives", "/friends", "/about", "/search"].map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
    }),
  );

  const postPages = posts.map((post) => ({
    url: `${base}/posts/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
  }));

  return [...staticPages, ...postPages];
}
