import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// 社交化功能测试:注册校验/好友流程(发申请→同意→删除)/朋友圈归属与作者信息
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
process.env.BLOG_DATA_DIR = path.join(tmpDir, "data");

const { db, closeDb } = await import("../src/lib/db");
const { notes, users } = await import("../src/db/schema");
const usersLib = await import("../src/lib/users");
const friendsLib = await import("../src/lib/friends");
const api = await import("../src/lib/content-api");

let admin: usersLib.SiteUser;
let xiaoming: usersLib.SiteUser;
let xiaohua: usersLib.SiteUser;

beforeAll(async () => {
  admin = await usersLib.registerUser({
    username: "admin",
    password: "123456",
    nickname: "站长",
  });
  xiaoming = await usersLib.registerUser({
    username: "xiaoming",
    password: "123456",
    nickname: "路人小妹",
  });
  xiaohua = await usersLib.registerUser({
    username: "xiaohua",
    password: "123456",
    nickname: "小花",
  });

  // 各发一条公开说说
  await db.insert(notes).values([
    { type: "moment", slug: "m-admin", title: "站长的动态", content: "欢迎来到我的站!", isPublic: 1, userId: admin.id },
    { type: "moment", slug: "m-xm", title: "小明的动态", content: "来交朋友!", isPublic: 1, userId: xiaoming.id },
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

describe("注册 registerUser", () => {
  it("非法用户名/短密码被拒绝", async () => {
    await expect(
      usersLib.registerUser({ username: "a", password: "123456" }),
    ).rejects.toThrow("用户名要 2~20 位");
    await expect(
      usersLib.registerUser({ username: "新用户", password: "12345" }),
    ).rejects.toThrow("密码至少 6 位");
  });

  it("用户名重复被拒绝", async () => {
    await expect(
      usersLib.registerUser({ username: "xiaoming", password: "123456" }),
    ).rejects.toThrow("用户名已被占用");
  });
});

describe("好友流程", () => {
  it("发申请 → 对方同意 → 成为好友", async () => {
    await friendsLib.sendFriendRequest(admin.id, xiaoming.id);
    expect((await friendsLib.getRelationStatus(admin.id, xiaoming.id)).status).toBe(
      "pending_out",
    );
    expect((await friendsLib.getRelationStatus(xiaoming.id, admin.id)).status).toBe(
      "pending_in",
    );

    const incoming = await friendsLib.listIncomingRequests(xiaoming.id);
    expect(incoming).toHaveLength(1);
    await friendsLib.acceptRequest(incoming[0].friendshipId, xiaoming.id);

    expect((await friendsLib.getRelationStatus(admin.id, xiaoming.id)).status).toBe("friends");
    const friends = await friendsLib.listFriends(admin.id);
    expect(friends.map((f) => f.user.username)).toContain("xiaoming");
  });

  it("重复申请/加自己被拒绝", async () => {
    await expect(
      friendsLib.sendFriendRequest(admin.id, xiaoming.id),
    ).rejects.toThrow("你们已经是好友了");
    await expect(
      friendsLib.sendFriendRequest(xiaoming.id, xiaoming.id),
    ).rejects.toThrow("不能添加自己为好友");
  });

  it("删除好友后关系归零", async () => {
    const [link] = await db
      .select()
      .from((await import("../src/db/schema")).friendships)
      .limit(1);
    await friendsLib.removeFriendship(link.id, admin.id);
    expect((await friendsLib.getRelationStatus(admin.id, xiaoming.id)).status).toBe("none");
    // 重新发一个,测"对方先发"的分支
    await friendsLib.sendFriendRequest(xiaoming.id, admin.id);
    expect((await friendsLib.getRelationStatus(admin.id, xiaoming.id)).status).toBe(
      "pending_in",
    );
  });
});

describe("朋友圈 listPublicMoments(多用户)", () => {
  it("汇集全站用户的公开动态,并带作者信息", async () => {
    const moments = await api.listPublicMoments();
    expect(moments).toHaveLength(2);
    const authors = moments.map((m) => m.author.username).sort();
    expect(authors).toEqual(["admin", "xiaoming"]);
    const xm = moments.find((m) => m.author.username === "xiaoming")!;
    expect(xm.author.nickname).toBe("路人小妹");
  });

  it("按作者过滤(个人主页用)", async () => {
    const moments = await api.listPublicMoments(20, 0, "xiaoming");
    expect(moments).toHaveLength(1);
    expect(moments[0].author.username).toBe("xiaoming");
  });
});

describe("内容归属(多用户隔离)", () => {
  it("用户只能看到自己的私有区内容", async () => {
    // 站长发一条私密笔记
    await (await import("../src/lib/notes")).createNote(
      { type: "note", title: "站长的私密笔记", content: "x" },
      admin.id,
    );
    const adminNotes = await (
      await import("../src/lib/kb-content")
    ).listKbNotes("note", admin);
    expect(adminNotes.map((n) => n.title)).toContain("站长的私密笔记");

    // 小花看站长的内容:一条也没有
    const xiaohuaNotes = await (
      await import("../src/lib/kb-content")
    ).listKbNotes("note", xiaohua);
    expect(xiaohuaNotes).toHaveLength(0);
  });
});
