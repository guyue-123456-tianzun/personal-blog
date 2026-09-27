// 网页剪藏(B2):粘贴 URL,服务端抓取正文,提取标题/描述/段落,存为剪藏笔记。
// 抓取只允许 http(s),15 秒超时,防 SSRF 不做内网判定(单机个人站,信任站长输入)。
import * as cheerio from "cheerio";

import { createNote } from "./notes";
import type { SiteUser } from "./users";

export async function clipUrl(
  url: string,
  user: SiteUser,
  tags: string[] = [],
) {
  const clean = url.trim();
  if (!/^https?:\/\//i.test(clean)) {
    throw new Error("URL 必须以 http(s):// 开头");
  }

  const res = await fetch(clean, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; PersonalBlogClipper/1.0; +https://github.com)",
    },
  });
  if (!res.ok) {
    throw new Error(`抓取失败(HTTP ${res.status})`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = ($("title").first().text() || clean).trim().slice(0, 120);
  const description = (
    $('meta[name="description"]').attr("content") ??
    $('meta[property="og:description"]').attr("content") ??
    ""
  )
    .trim()
    .slice(0, 200);

  // 正文:抽取所有有内容的段落,拼成 Markdown
  const paragraphs = $("p, pre, h2, h3")
    .map((_, el) => {
      const tag = (el as { tagName?: string }).tagName ?? "";
      const text = $(el).text().trim();
      if (!text) return "";
      if (tag.startsWith("h")) return `## ${text}`;
      return text;
    })
    .get()
    .filter((t) => t.length > 15)
    .slice(0, 60);

  const content =
    `> 剪藏自:[${title}](${clean})\n\n` +
    (description ? `${description}\n\n` : "") +
    paragraphs.join("\n\n");

  return createNote(
    {
      type: "clip",
      title,
      content,
      sourceUrl: clean,
      tags,
      isPublic: 0,
    },
    user.id,
  );
}
