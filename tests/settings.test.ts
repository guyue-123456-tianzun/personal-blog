import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// 设置页相关:改密码(验旧设新)与站点头像读取
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
process.env.BLOG_DATA_DIR = path.join(tmpDir, "data");

const { closeDb } = await import("../src/lib/db");
const users = await import("../src/lib/users");
const { getSiteAvatar } = await import("../src/lib/settings");

afterAll(async () => {
  await closeDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("changePassword", () => {
  it("旧密码不对时拒绝", async () => {
    const user = await users.registerUser({ username: "pw-a", password: "old-pw-123" });
    await expect(
      users.changePassword(user.id, "wrong-old", "new-pw-99"),
    ).rejects.toThrow("旧密码不对");
  });

  it("旧密码正确时改密成功,可用新密码继续改回", async () => {
    const user = await users.registerUser({ username: "pw-b", password: "old-pw-123" });
    await users.changePassword(user.id, "old-pw-123", "new-pw-99");
    // 反向验证:新密码被认作"旧密码"通过校验,说明哈希真的换了
    await users.changePassword(user.id, "new-pw-99", "another-66");
  });

  it("新密码太短被拒绝", async () => {
    const user = await users.getUserByUsername("pw-b");
    await expect(
      users.changePassword(user!.id, "another-66", "12345"),
    ).rejects.toThrow("新密码至少 6 位");
  });
});

describe("getSiteAvatar", () => {
  it("返回 null 或字符串,不抛错", async () => {
    const value = await getSiteAvatar();
    expect(value === null || typeof value === "string").toBe(true);
  });
});
