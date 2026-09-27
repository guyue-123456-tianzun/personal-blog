import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// 全文搜索(search.ts)的功能测试:标题/正文命中、通配符转义、排除回收站、命中摘要
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");

const { db, closeDb } = await import("../src/lib/db");
const { notes } = await import("../src/db/schema");
const { searchNotes } = await import("../src/lib/search");

beforeAll(async () => {
  await db.insert(notes).values([
    { type: "note", slug: "deploy", title: "服务器部署手册", content: "第一步:安装 nginx 并配置反向代理。", isPublic: 0 },
    { type: "note", slug: "percent", title: "随手记", content: "_battery_ 电量 100% 的测试数据 _x_", isPublic: 0 },
    { type: "post", slug: "blog", title: "一篇博客", content: "正文里提到部署这件事。", isPublic: 1 },
    { type: "note", slug: "trashed", title: "已删除的部署笔记", content: "部署相关但进了回收站。", isPublic: 0, deletedAt: "2026-09-27 00:00:00" },
  ]);
});

afterAll(() => {
  closeDb();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Windows 句柄释放延迟,清理失败不影响结论
  }
});

describe("searchNotes 全文搜索", () => {
  it("标题和正文都能命中", async () => {
    const hits = await searchNotes("nginx");
    expect(hits).toHaveLength(1);
    expect(hits[0].slug).toBe("deploy");

    const blogHits = await searchNotes("一篇博客");
    expect(blogHits.map((h) => h.slug)).toContain("blog");
  });

  it("跨类型搜索(公开文章和私有笔记一起搜)", async () => {
    const hits = await searchNotes("部署");
    expect(hits.map((h) => h.slug).sort()).toEqual(["blog", "deploy"].sort());
  });

  it("回收站里的内容搜不到(隐私兜底)", async () => {
    const hits = await searchNotes("进了回收站");
    expect(hits).toHaveLength(0);
  });

  it("LIKE 通配符被正确转义:% 不会变成任意匹配", async () => {
    const hits = await searchNotes("100%");
    expect(hits).toHaveLength(1);
    expect(hits[0].slug).toBe("percent");
    // 如果 % 没转义,"_%x_" 这种模式会大面积误命中
    const wide = await searchNotes("_x_");
    expect(wide.map((h) => h.slug)).toEqual(["percent"]);
  });

  it("命中摘要能截到关键词附近", async () => {
    const [hit] = await searchNotes("反向代理");
    expect(hit.snippet).toContain("反向代理");
  });

  it("空搜索词返回空数组", async () => {
    expect(await searchNotes("   ")).toEqual([]);
  });
});
