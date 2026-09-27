import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// AI 桌宠配置与提示词的功能测试
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
process.env.BLOG_DATA_DIR = path.join(tmpDir, "data");

const { db, closeDb } = await import("../src/lib/db");
const { notes } = await import("../src/db/schema");
const ai = await import("../src/lib/ai");

beforeAll(async () => {
  await db.insert(notes).values([
    {
      type: "post",
      slug: "hello-erii",
      title: "绘梨衣来啦",
      content: "桌宠上线的第一篇文章。",
      excerpt: "桌宠上线的第一篇文章。",
      isPublic: 1,
      publishedAt: "2026-09-28 10:00:00",
    },
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

describe("AI 配置 settings 读写", () => {
  it("默认人设是绘梨衣,默认开启", async () => {
    const config = await ai.getAiConfig();
    expect(config.enabled).toBe(true);
    expect(config.persona).toContain("绘梨衣");
    expect(config.baseUrl).toBe("");
  });

  it("保存后可读回;key 掩码不泄露完整密钥", async () => {
    await ai.saveAiConfig({
      ai_base_url: "https://open.bigmodel.cn/api/paas/v4",
      ai_api_key: "my-secret-key-123456",
      ai_model: "glm-4-flash",
    });
    const masked = await ai.getAiConfigMasked();
    expect(masked.baseUrl).toBe("https://open.bigmodel.cn/api/paas/v4");
    expect(masked.model).toBe("glm-4-flash");
    expect(masked.apiKey).toContain("****");
    expect(masked.apiKey).not.toBe("my-secret-key-123456");
    // 完整 key 只在服务端内部可见
    const full = await ai.getAiConfig();
    expect(full.apiKey).toBe("my-secret-key-123456");
  });
});

describe("桌宠系统提示词 buildSystemPrompt", () => {
  it("包含人设、站点信息与最近文章标题", async () => {
    const prompt = await ai.buildSystemPrompt();
    expect(prompt).toContain("绘梨衣");
    expect(prompt).toContain("个人站");
    expect(prompt).toContain("绘梨衣来啦");
  });
});
