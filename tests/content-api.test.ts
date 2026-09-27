import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// 内容读取层(content-api.ts)的功能测试。
// 每个测试文件用独立的临时数据库:先把 BLOG_DB_PATH 指到临时目录,
// 再动态引入 db/content-api,保证测试永不碰真实数据、互相之间也不干扰。
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");

const { db, closeDb } = await import("../src/lib/db");
const { notes, tags, noteTags } = await import("../src/db/schema");
const api = await import("../src/lib/content-api");

let idPinned: number;
let idNew: number;
let idOld: number;
let tagSuiBi: number;
let tagCeShi: number;

beforeAll(async () => {
  const inserted = await db
    .insert(notes)
    .values([
      // 应该出现在公开列表里的三篇:置顶一篇、2026 一篇、2025 一篇
      { type: "post", slug: "pinned", title: "置顶文章", content: "x", isPublic: 1, pinned: 1, publishedAt: "2026-01-01 10:00:00" },
      { type: "post", slug: "new", title: "新文章", content: "x", isPublic: 1, publishedAt: "2026-05-01 10:00:00" },
      { type: "post", slug: "old", title: "旧文章", content: "x", isPublic: 1, publishedAt: "2025-03-01 10:00:00" },
      // 不应该出现的四种情况:未公开、已删除(软删除)、非文章类型(日记)
      { type: "post", slug: "private", title: "未发布", content: "x", isPublic: 0, publishedAt: "2026-06-01 10:00:00" },
      { type: "post", slug: "deleted", title: "已删除", content: "x", isPublic: 1, publishedAt: "2026-07-01 10:00:00", deletedAt: "2026-07-02 00:00:00" },
      { type: "diary", slug: "diary-1", title: "日记", content: "x", isPublic: 0, publishedAt: "2026-08-01 10:00:00" },
    ])
    .returning({ id: notes.id, slug: notes.slug });

  const bySlug = new Map(inserted.map((r) => [r.slug, r.id]));
  idPinned = bySlug.get("pinned")!;
  idNew = bySlug.get("new")!;
  idOld = bySlug.get("old")!;

  const insertedTags = await db
    .insert(tags)
    .values([{ name: "随笔" }, { name: "测试" }])
    .returning({ id: tags.id, name: tags.name });
  tagSuiBi = insertedTags.find((t) => t.name === "随笔")!.id;
  tagCeShi = insertedTags.find((t) => t.name === "测试")!.id;

  // 置顶←随笔;新文章←随笔+测试;旧文章←测试
  await db.insert(noteTags).values([
    { noteId: idPinned, tagId: tagSuiBi },
    { noteId: idNew, tagId: tagSuiBi },
    { noteId: idNew, tagId: tagCeShi },
    { noteId: idOld, tagId: tagCeShi },
  ]);
});

afterAll(() => {
  closeDb();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Windows 下文件句柄释放可能有延迟,清理失败不影响测试结论
  }
});

describe("getPublishedPosts 公开文章列表", () => {
  it("只含公开且未删除的 post 类型,置顶优先、时间倒序", async () => {
    const posts = await api.getPublishedPosts();
    expect(posts.map((p) => p.slug)).toEqual(["pinned", "new", "old"]);
  });

  it("每篇都带上了自己的标签", async () => {
    const posts = await api.getPublishedPosts();
    const byNew = posts.find((p) => p.slug === "new")!;
    expect(byNew.tags.sort()).toEqual(["测试", "随笔"]);
  });
});

describe("getPostBySlug 文章详情", () => {
  it("公开文章返回全文与标签", async () => {
    const post = await api.getPostBySlug("new");
    expect(post).not.toBeNull();
    expect(post!.title).toBe("新文章");
    expect(post!.tags.sort()).toEqual(["测试", "随笔"]);
  });

  it("未公开/已删除/不存在 一律返回 null", async () => {
    expect(await api.getPostBySlug("private")).toBeNull();
    expect(await api.getPostBySlug("deleted")).toBeNull();
    expect(await api.getPostBySlug("no-such-post")).toBeNull();
  });
});

describe("getTagCloud 标签云", () => {
  it("只统计公开文章,数量正确", async () => {
    const cloud = await api.getTagCloud();
    const byName = new Map(cloud.map((t) => [t.name, t.count]));
    expect(byName.get("随笔")).toBe(2); // 置顶 + 新文章
    expect(byName.get("测试")).toBe(2); // 新文章 + 旧文章
  });
});

describe("getPostsByTag 按标签取文章", () => {
  it("返回该标签下全部公开文章,按时间倒序", async () => {
    const posts = await api.getPostsByTag("随笔");
    expect(posts.map((p) => p.slug)).toEqual(["new", "pinned"]);
  });

  it("不存在的标签返回空数组", async () => {
    expect(await api.getPostsByTag("不存在的标签")).toEqual([]);
  });
});

describe("getArchives 归档", () => {
  it("按年分组、年内时间倒序,不含日记与未公开", async () => {
    const archives = await api.getArchives();
    expect(archives.map((a) => a.year)).toEqual(["2026", "2025"]);
    expect(archives[0].posts.map((p) => p.slug)).toEqual(["new", "pinned"]);
    expect(archives[1].posts.map((p) => p.slug)).toEqual(["old"]);
  });
});
