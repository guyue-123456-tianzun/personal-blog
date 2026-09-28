import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// M3 功能测试:外观设置(默认值/覆盖/清除回落)、公开搜索(私有内容绝不出现)、站点统计
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
process.env.BLOG_DATA_DIR = path.join(tmpDir, "data");

const { db, closeDb } = await import("../src/lib/db");
const { notes } = await import("../src/db/schema");
const settings = await import("../src/lib/settings");
const search = await import("../src/lib/search");
const stats = await import("../src/lib/site-stats");

beforeAll(async () => {
  await db.insert(notes).values([
    { type: "post", slug: "public-1", title: "公开文章", content: "关于部署的知识", isPublic: 1, publishedAt: "2026-09-27 10:00:00" },
    { type: "post", slug: "public-2", title: "另一篇", content: "生活随笔", isPublic: 1, publishedAt: "2026-09-26 10:00:00" },
    { type: "post", slug: "secret", title: "未公开", content: "部署的草稿", isPublic: 0 },
    { type: "note", slug: "kb-1", title: "私有笔记", content: "部署笔记(私有)", isPublic: 0 },
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

describe("外观设置 settings.ts", () => {
  it("无设置时回落到 site-config 默认值", async () => {
    const appearance = await settings.getAppearance();
    expect(appearance.heroImage).toBe("/images/hero-default.svg");
    expect(appearance.heroBlur).toBe(0);
    expect(appearance.heroHeightVh).toBe(70);
    expect(appearance.announcements.length).toBeGreaterThan(0);
  });

  it("覆盖后生效;越界值被夹回合法区间", async () => {
    await settings.setSetting("hero_blur", "99");
    await settings.setSetting("hero_height", "10");
    await settings.setSetting("signature", "测试签名");
    const appearance = await settings.getAppearance();
    expect(appearance.heroBlur).toBe(24); // 夹回上限
    expect(appearance.heroHeightVh).toBe(40); // 夹回下限
    expect(appearance.signature).toBe("测试签名");
  });

  it("清除后回落默认(永远有图可用)", async () => {
    await settings.clearSetting("signature");
    const appearance = await settings.getAppearance();
    expect(appearance.signature).not.toBe("测试签名");
  });
});

describe("公开搜索 searchPublishedPosts", () => {
  it("只搜得到公开文章,私有笔记/未公开草稿绝不出现", async () => {
    const hits = await search.searchPublishedPosts("部署");
    expect(hits.map((h) => h.slug)).toEqual(["public-1"]);
  });

  it("命中摘要包含关键词", async () => {
    const [hit] = await search.searchPublishedPosts("生活");
    expect(hit.snippet).toContain("生活");
  });

  it("空搜索词返回空数组", async () => {
    expect(await search.searchPublishedPosts("")).toEqual([]);
  });
});

describe("站点统计 getSiteStats / 浏览计数", () => {
  it("文章数只统计公开文章", async () => {
    const site = await stats.getSiteStats();
    expect(site.posts).toBe(2);
  });

  it("浏览计数:记两次就是 2,并且计入总浏览", async () => {
    await stats.recordPostView("public-1");
    await stats.recordPostView("public-1");
    expect(await stats.getPostViews("public-1")).toBe(2);
    const site = await stats.getSiteStats();
    expect(site.views).toBe(2);
  });

  it("运行天数为非负整数", async () => {
    const site = await stats.getSiteStats();
    expect(Number.isInteger(site.days)).toBe(true);
    expect(site.days).toBeGreaterThanOrEqual(0);
  });
});

describe("沉浸式壁纸外观键", () => {
  it("未设置壁纸时跟随 Hero 图;设置后独立生效", async () => {
    const before = await settings.getAppearance();
    expect(before.wallImage).toBe(before.heroImage); // 默认跟随
    await settings.setSetting("wall_image_url", "/images/cover-1.svg");
    const after = await settings.getAppearance();
    expect(after.wallImage).toBe("/images/cover-1.svg");
    expect(after.heroImage).toBe(before.heroImage); // Hero 不受影响
  });

  it("壁纸虚化越界值被夹回 0~30", async () => {
    await settings.setSetting("wall_blur", "99");
    expect((await settings.getAppearance()).wallBlur).toBe(30);
    await settings.clearSetting("wall_blur");
    expect((await settings.getAppearance()).wallBlur).toBe(18); // 默认
  });
});

describe("在线访客心跳", () => {
  it("记录心跳后窗口内计数正确", async () => {
    const before = stats.getOnlineCount();
    stats.recordHeartbeat("hb-1");
    stats.recordHeartbeat("hb-2");
    const after = stats.getOnlineCount();
    expect(after).toBeGreaterThanOrEqual(before + 2);
  });
});
