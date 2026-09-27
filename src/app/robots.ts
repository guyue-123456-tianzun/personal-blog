import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/kb", "/api", "/login"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
