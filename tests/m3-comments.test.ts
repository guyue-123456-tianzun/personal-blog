import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// 评论系统 + 站点每日浏览 + RSS 的功能测试
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
process.env.BLOG_DATA_DIR = path.join(tmpDir, "data");

const { db, closeDb } = await import("../src/lib/db");
const { notes } = await import("../src/db/schema");
const commentsLib = await import("../src/lib/comments");
const stats = await import("../src/lib/site-stats");
const { buildRssXml } = await import("../src/lib/rss");

let publicSlug = "rss-post";

beforeAll(async () => {
  await db.insert(notes).values([
    { type: "post", slug: publicSlug, title: "带 & 符号的标题", content: "正文", isPublic: 1, publishedAt: "2026-09-27 10:00:00" },
    { type: "note", slug: "private-kb", title: "私有笔记", content: "x", isPublic: 0 },
  ]);
});

afterAll(() => {
  closeDb();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Windows 句柄延迟,不影响结论
  }
});

describe("评论系统 comments.ts", () => {
  it("正常提交并按顺序读出", async () => {
    await commentsLib.addComment("ip-1", publicSlug, { author: "路人甲", content: "沙发!" });
    await commentsLib.addComment("ip-1", publicSlug, { author: "路人乙", content: "板凳。" });
    const list = await commentsLib.listComments(publicSlug);
    expect(list.map((c) => c.author)).toEqual(["路人甲", "路人乙"]);
  });

  it("不存在的文章/私有内容不能评论", async () => {
    await expect(
      commentsLib.addComment("ip-1", "no-such-post", { author: "x", content: "y" }),
    ).rejects.toThrow("文章不存在或未发布");
    await expect(
      commentsLib.addComment("ip-1", "private-kb", { author: "x", content: "y" }),
    ).rejects.toThrow("文章不存在或未发布");
  });

  it("昵称和内容不能为空,超长内容被截断而不是报错", async () => {
    await expect(
      commentsLib.addComment("ip-2", publicSlug, { author: "  ", content: "y" }),
    ).rejects.toThrow("昵称不能为空");
    const saved = await commentsLib.addComment("ip-2", publicSlug, {
      author: "长文测试",
      content: "啊".repeat(600),
    });
    expect(saved.content.length).toBe(500);
  });

  it("同一来源 60 秒内超过 5 条被限流", async () => {
    for (let i = 0; i < 5; i++) {
      await commentsLib.addComment("ip-burst", publicSlug, { author: ` bursts-${i}`, content: "第" + i + "条" });
    }
    await expect(
      commentsLib.addComment("ip-burst", publicSlug, { author: "burst", content: "第6条" }),
    ).rejects.toThrow("评论太频繁了");
    // 换一个来源不受影响
    await expect(
      commentsLib.addComment("ip-calm", publicSlug, { author: "calm", content: "正常" }),
    ).resolves.toBeTruthy();
  });

  it("隐藏后访客列表里看不到", async () => {
    const added = await commentsLib.addComment("ip-hide", publicSlug, { author: "灌水者", content: "广告" });
    await commentsLib.hideComment(added.id);
    const list = await commentsLib.listComments(publicSlug);
    expect(list.map((c) => c.author)).not.toContain("灌水者");
  });
});

describe("站点每日浏览 site_views", () => {
  it("记两次当天就是 2,并体现在 getSiteStats().today", async () => {
    await stats.recordSiteVisit();
    await stats.recordSiteVisit();
    const site = await stats.getSiteStats();
    expect(site.today).toBeGreaterThanOrEqual(2);
  });
});

describe("RSS 生成", () => {
  it("输出合法 XML,标题被转义,含文章条目", () => {
    const xml = buildRssXml([
      { slug: publicSlug, title: "带 & 符号的标题", excerpt: "摘要", publishedAt: "2026-09-27 10:00:00" },
    ]);
    expect(xml.startsWith("<?xml")).toBe(true);
    expect(xml).toContain("带 &amp; 符号的标题");
    expect(xml).toContain(`<link>/posts/${publicSlug}</link>`);
  });
});
