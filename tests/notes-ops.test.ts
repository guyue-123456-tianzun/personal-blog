import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

// 私有区写入层(notes.ts)的功能测试:
// 建笔记与 slug 去重、更新时自动存版本、版本上限清理、回滚、软删除→还原→彻底删除
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
process.env.BLOG_DATA_DIR = path.join(tmpDir, "data");

const { db, closeDb } = await import("../src/lib/db");
const { attachments, noteTags, noteVersions } = await import("../src/db/schema");
const ops = await import("../src/lib/notes");
const { getKbNote, listKbNotes } = await import("../src/lib/kb-content");
const { registerUser } = await import("../src/lib/users");

// 测试专用用户
const admin = await registerUser({ username: "ops-admin", password: "123456", nickname: "测试站长" });

let idA: number;

beforeAll(async () => {
  const a = await ops.createNote({ type: "note", title: "测试笔记", content: "第一版内容" }, admin.id);
  idA = a.id;
});

afterAll(() => {
  closeDb();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // 同上:Windows 句柄延迟
  }
});

describe("createNote / slug", () => {
  it("中文标题生成中文 slug;重名自动加 -2", async () => {
    expect(
      (await ops.createNote({ type: "note", title: "测试笔记", content: "x" }, admin.id)).slug,
    ).toBe("测试笔记-2");
  });
});

describe("版本历史(C7)", () => {
  it("每次更新自动存档旧版;回滚把内容退回去,且回滚前的状态也入了档", async () => {
    await ops.updateNote(idA, { content: "第二版内容", snapshot: true }, admin);
    await ops.updateNote(idA, { content: "第三版内容", snapshot: true }, admin);
    let versions = await ops.listVersions(idA);
    expect(versions).toHaveLength(2); // 第一版、第二版

    // 回滚到最早那份(第一版)
    const oldest = versions[versions.length - 1];
    await ops.rollbackToVersion(idA, oldest.id, admin);

    const after = await getKbNote(idA, admin);
    expect(after!.content).toBe("第一版内容");
    versions = await ops.listVersions(idA);
    expect(versions).toHaveLength(3); // 回滚前把"第三版"也存了档
  });

  it("版本只保留最近 20 份,更老的自动清理", async () => {
    for (let i = 0; i < 25; i++) {
      await ops.updateNote(idA, { content: `批量改动第 ${i} 轮`, snapshot: true }, admin);
    }
    const versions = await ops.listVersions(idA);
    expect(versions).toHaveLength(20);
  });
});

describe("回收站三连:软删除 → 还原 → 彻底删除", () => {
  it("软删除后不出现在列表里,但 getKbNote(单篇) 还在;还原后回到列表", async () => {
    const note = await ops.createNote({ type: "note", title: "要被删的", content: "x", tags: ["临时"] }, admin.id);
    await ops.softDeleteNote(note.id, admin);

    const listed = await listKbNotes("note", admin);
    expect(listed.map((n) => n.id)).not.toContain(note.id);
    expect(await getKbNote(note.id, admin)).not.toBeNull(); // 数据仍在库里

    await ops.restoreNote(note.id, admin);
    expect((await listKbNotes("note", admin)).map((n) => n.id)).toContain(note.id);
  });

  it("彻底删除清掉版本与标签,附件只解绑不删文件记录", async () => {
    const note = await ops.createNote({ type: "note", title: "彻底删的", content: "x", tags: ["消失"] }, admin.id);
    await ops.updateNote(note.id, { content: "改一次攒个版本", snapshot: true }, admin);
    // 造一个挂在这条笔记上的附件记录
    const [file] = await db
      .insert(attachments)
      .values({ noteId: note.id, filename: "a.png", storedPath: "uploads/0/0/x.png", mime: "image/png", size: 1 })
      .returning();

    await ops.purgeNote(note.id, admin);

    expect(await getKbNote(note.id, admin)).toBeNull();
    expect(await db.select().from(noteVersions).where(eq(noteVersions.noteId, note.id))).toHaveLength(0);
    expect(await db.select().from(noteTags).where(eq(noteTags.noteId, note.id))).toHaveLength(0);
    const [fileAfter] = await db.select().from(attachments).where(eq(attachments.id, file.id));
    expect(fileAfter.noteId).toBeNull();
  });
});
