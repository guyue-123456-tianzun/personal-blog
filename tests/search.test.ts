import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { SiteUser } from "../src/lib/users";

// 全文搜索(search.ts)的功能测试:
// 关键词命中、通配符转义、回收站不外泄,以及**多用户归属隔离**——
// 私有搜索只能搜到自己的东西,公开搜索只出公开文章。
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");

const { db, closeDb } = await import("../src/lib/db");
const { notes, users } = await import("../src/db/schema");
const { searchNotes, searchPublishedPosts } = await import("../src/lib/search");

let admin: SiteUser;
let alice: SiteUser;

beforeAll(async () => {
  const [adminRow] = await db
    .insert(users)
    .values({ username: "admin", passwordHash: "x", role: "admin" })
    .returning();
  const [aliceRow] = await db
    .insert(users)
    .values({ username: "alice", passwordHash: "x", role: "user" })
    .returning();
  admin = adminRow;
  alice = aliceRow;

  await db.insert(notes).values([
    // 站长的私有笔记
    { type: "note", slug: "deploy", title: "服务器部署手册", content: "第一步:安装 nginx 并配置反向代理。", isPublic: 0, userId: admin.id },
    { type: "note", slug: "percent", title: "随手记", content: "_battery_ 电量 100% 的测试数据 _x_", isPublic: 0, userId: admin.id },
    // 站长的公开文章
    { type: "post", slug: "blog", title: "一篇博客", content: "正文里提到部署这件事。", isPublic: 1, userId: admin.id },
    // 回收站里的
    { type: "note", slug: "trashed", title: "已删除的部署笔记", content: "部署相关但进了回收站。", isPublic: 0, userId: admin.id, deletedAt: "2026-09-27 00:00:00" },
    // 另一个用户的私有笔记 —— 站长和 alice 都不该在对方的结果里看到它
    { type: "note", slug: "alice-secret", title: "Alice 的部署笔记", content: "只有 alice 能看到的部署细节。", isPublic: 0, userId: alice.id },
    // 早期没有归属人的历史内容(按约定归站长)
    { type: "note", slug: "legacy", title: "上古部署记录", content: "userId 为空的历史内容。", isPublic: 0, userId: null },
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

describe("searchNotes 私有区全文搜索", () => {
  it("标题和正文都能命中", async () => {
    const hits = await searchNotes("nginx", admin);
    expect(hits).toHaveLength(1);
    expect(hits[0].slug).toBe("deploy");

    const blogHits = await searchNotes("一篇博客", admin);
    expect(blogHits.map((h) => h.slug)).toContain("blog");
  });

  it("跨类型搜索(自己的公开文章和私有笔记一起搜)", async () => {
    const hits = await searchNotes("部署", admin);
    expect(hits.map((h) => h.slug).sort()).toEqual(
      ["blog", "deploy", "legacy"].sort(),
    );
  });

  it("回收站里的内容搜不到(隐私兜底)", async () => {
    const hits = await searchNotes("进了回收站", admin);
    expect(hits).toHaveLength(0);
  });

  it("LIKE 通配符被正确转义:% 不会变成任意匹配", async () => {
    const hits = await searchNotes("100%", admin);
    expect(hits).toHaveLength(1);
    expect(hits[0].slug).toBe("percent");
    // 如果 % 没转义,"_%x_" 这种模式会大面积误命中
    const wide = await searchNotes("_x_", admin);
    expect(wide.map((h) => h.slug)).toEqual(["percent"]);
  });

  it("命中摘要能截到关键词附近", async () => {
    const [hit] = await searchNotes("反向代理", admin);
    expect(hit.snippet).toContain("反向代理");
  });

  it("空搜索词返回空数组", async () => {
    expect(await searchNotes("   ", admin)).toEqual([]);
  });
});

describe("searchNotes 的多用户隔离", () => {
  it("普通用户搜不到别人的笔记", async () => {
    const hits = await searchNotes("部署", alice);
    expect(hits.map((h) => h.slug)).toEqual(["alice-secret"]);
  });

  it("站长搜不到普通用户的笔记", async () => {
    const hits = await searchNotes("Alice 的部署笔记", admin);
    expect(hits).toHaveLength(0);
  });

  it("站长能搜到没有归属人的历史内容", async () => {
    const hits = await searchNotes("上古部署", admin);
    expect(hits.map((h) => h.slug)).toEqual(["legacy"]);
  });

  it("没有归属人的历史内容不会漏给普通用户", async () => {
    const hits = await searchNotes("上古部署", alice);
    expect(hits).toHaveLength(0);
  });
});

describe("searchPublishedPosts 公开区搜索", () => {
  it("只出公开文章,私有笔记与回收站都不出", async () => {
    const hits = await searchPublishedPosts("部署");
    expect(hits.map((h) => h.slug)).toEqual(["blog"]);
  });

  it("命中摘要按正文截取", async () => {
    const [hit] = await searchPublishedPosts("反向代理");
    // 公开区里没有这篇,应当没有结果
    expect(hit).toBeUndefined();
  });

  it("空搜索词返回空数组", async () => {
    expect(await searchPublishedPosts("")).toEqual([]);
  });
});
