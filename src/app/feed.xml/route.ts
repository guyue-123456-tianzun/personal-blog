import { getPublishedPosts } from "@/lib/content-api";
import { buildRssXml } from "@/lib/rss";

// RSS 订阅源:阅读器订阅 /feed.xml 即可
export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getPublishedPosts();
  return new Response(buildRssXml(posts.slice(0, 20)), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800",
    },
  });
}
