import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// M4a 内容功能测试:说说流(公开过滤/配图/照片墙) + 书影音 CRUD 与状态标签
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
process.env.BLOG_DATA_DIR = path.join(tmpDir, "data");

const { db, closeDb } = await import("../src/lib/db");
const { attachments, notes } = await import("../src/db/schema");
const api = await import("../src/lib/content-api");
const mediaLib = await import("../src/lib/media");
const { registerUser } = await import("../src/lib/users");

const author = await registerUser({ username: "moments-author", password: "123456" });

let publicMomentId: number;

beforeAll(async () => {
  const rows = await db
    .insert(notes)
    .values([
      { type: "moment", slug: "moment-public", title: "公开说说", content: "晚风很温柔。", isPublic: 1, publishedAt: "2026-09-27 19:00:00", userId: author.id },
      { type: "moment", slug: "moment-private", title: "私密说说", content: "这条看不见。", isPublic: 0, userId: author.id },
      { type: "moment", slug: "moment-deleted", title: "删掉的说说", content: "已进回收站。", isPublic: 1, deletedAt: "2026-09-27 00:00:00", userId: author.id },
    ])
    .returning({ id: notes.id, slug: notes.slug });
  publicMomentId = rows.find((r) => r.slug === "moment-public")!.id;

  // 公开说说挂一张公开图片;再放一张私有图片(不应出现在公开说说里)
  await db.insert(attachments).values([
    { noteId: publicMomentId, filename: "pub.png", storedPath: "uploads/0/0/pub.png", mime: "image/png", size: 1, isPublic: 1 },
    { noteId: publicMomentId, filename: "priv.png", storedPath: "uploads/0/0/priv.png", mime: "image/png", size: 1, isPublic: 0 },
    { noteId: null, filename: "wall.png", storedPath: "uploads/0/0/wall.png", mime: "image/png", size: 1, isPublic: 1 },
  ]);

  // 书影音样例
  await mediaLib.createMedia({ type: "book", title: "置身事外", status: "done", rating: 9 }, author.id);
  await mediaLib.createMedia({ type: "movie", title: "星际穿越", status: "done", rating: 10 }, author.id);
  await mediaLib.createMedia({ type: "game", title: "王国之泪", status: "doing", rating: 9 }, author.id);
});

afterAll(() => {
  closeDb();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Windows 句柄延迟,不影响结论
  }
});

describe("说说流 listPublicMoments", () => {
  it("只含公开且未删除的说说", async () => {
    const moments = await api.listPublicMoments();
    expect(moments).toHaveLength(1);
    expect(moments[0].content).toBe("晚风很温柔。");
  });

  it("配图只带公开图片,私有图片不出现", async () => {
    const [moment] = await api.listPublicMoments();
    expect(moment.images).toHaveLength(1);
    expect(moment.images[0].url).toContain("/api/kb/attachments/");
  });

  it("说说里的图片同时进照片墙", async () => {
    const images = await api.listPublicImages();
    // 公开说说配图 1 张 + 独立公开壁纸 1 张
    expect(images.length).toBe(2);
  });
});

describe("书影音 media.ts", () => {
  it("非法类型/越界评分被拒绝", async () => {
    await expect(
      mediaLib.createMedia({ type: "anime", title: "x", status: "done" }, author.id),
    ).rejects.toThrow("类型必须是");
    await expect(
      mediaLib.createMedia(
        { type: "book", title: "x", status: "done", rating: 11 },
        author.id,
      ),
    ).rejects.toThrow("评分要在 0~10 之间");
  });

  it("按类型筛选清单", async () => {
    const books = await mediaLib.listMedia("book");
    expect(books.map((b) => b.title)).toEqual(["置身事外"]);
    expect(await mediaLib.listMedia()).toHaveLength(3);
  });

  it("更新与删除", async () => {
    const created = await mediaLib.createMedia({ type: "game", title: "临时", status: "wish" }, author.id);
    const updated = await mediaLib.updateMedia(created.id, { status: "done", rating: 8 }, author);
    expect(updated!.status).toBe("done");
    expect(updated!.rating).toBe(8);
    expect(await mediaLib.deleteMedia(created.id, author)).not.toBeNull();
    expect(await mediaLib.listMedia()).toHaveLength(3);
  });

  it("状态标签按类型翻译", async () => {
    expect(mediaLib.statusLabel("book", "done")).toBe("读完");
    expect(mediaLib.statusLabel("movie", "wish")).toBe("想看");
    expect(mediaLib.statusLabel("game", "doing")).toBe("在玩");
  });
});

// 升级成多用户之前发的动态 userId 是空的。这类内容以前会被"取作者"的内连接整个丢掉,
// 在公开朋友圈里凭空消失——这里把这条边界钉住
describe("说说流里的历史动态(无归属人)", () => {
  const legacyContent = "升级成多用户之前发的动态。";

  beforeAll(async () => {
    await db.insert(notes).values({
      type: "moment",
      slug: "legacy-moment",
      title: "历史动态",
      content: legacyContent,
      isPublic: 1,
      userId: null,
    });
  });

  it("userId 为空的公开动态仍然出现在公开流里,并落款到站长", async () => {
    const moments = await api.listPublicMoments();
    const legacy = moments.find((m) => m.content === legacyContent);
    expect(legacy).toBeDefined();
    expect(legacy?.author.username).toBeTruthy();
  });

  it("按站长主页筛选时,这类动态也算站长的", async () => {
    const { getAdminUser } = await import("../src/lib/users");
    const admin = await getAdminUser();
    expect(admin).not.toBeNull();
    const moments = await api.listPublicMoments(10, 0, admin!.username);
    expect(moments.some((m) => m.content === legacyContent)).toBe(true);
  });
});
