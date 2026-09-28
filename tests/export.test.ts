import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import JSZip from "jszip";

// C8 全量导出的功能测试:zip 结构正确、内容带 frontmatter、附件进了包、清单数字对
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
const dataDir = path.join(tmpDir, "data");
process.env.BLOG_DB_PATH = path.join(dataDir, "test.db");
process.env.BLOG_DATA_DIR = dataDir;

const { db, closeDb } = await import("../src/lib/db");
const { attachments } = await import("../src/db/schema");
const { buildExportZip } = await import("../src/lib/export");
const { registerUser } = await import("../src/lib/users");

const owner = await registerUser({ username: "export-owner", password: "123456" });
const outsider = await registerUser({ username: "export-outsider", password: "123456" });

let postSlug: string;
let noteSlug: string;

beforeAll(async () => {
  const create = async (type: string, title: string) => {
    const { createNote } = await import("../src/lib/notes");
    return createNote({ type, title, content: `# ${title}\n\n正文`, tags: ["导出测试"] }, owner.id);
  };
  postSlug = (await create("post", "博客文章")).slug;
  noteSlug = (await create("note", "私有笔记")).slug;

  // create 函数已定义在上方

  // 一个真实存在的附件文件 + 记录(归属导出者本人)
  const rel = "uploads/2026/09/test-export.png";
  fs.mkdirSync(path.join(dataDir, "uploads/2026/09"), { recursive: true });
  fs.writeFileSync(path.join(dataDir, rel), Buffer.from("fake-png-bytes"));
  await db.insert(attachments).values({
    noteId: null,
    userId: owner.id,
    filename: "test-export.png",
    storedPath: rel,
    mime: "image/png",
    size: 15,
  });

  // 另一个用户的私有附件:绝不该出现在导出包里
  const otherRel = "uploads/2026/09/other-secret.png";
  fs.writeFileSync(path.join(dataDir, otherRel), Buffer.from("other-bytes"));
  await db.insert(attachments).values({
    noteId: null,
    userId: outsider.id,
    filename: "other-secret.png",
    storedPath: otherRel,
    mime: "image/png",
    size: 11,
  });
});

afterAll(() => {
  closeDb();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // 同上
  }
});

describe("buildExportZip 全量导出", () => {
  it("zip 里分目录装着文章、笔记、附件和清单", async () => {
    const zipBytes = await buildExportZip(owner);
    const zip = await JSZip.loadAsync(zipBytes);
    const names = Object.keys(zip.files);

    expect(names).toContain(`posts/${postSlug}.md`);
    expect(names).toContain(`notes/${noteSlug}.md`);
    expect(names.some((n) => n.startsWith("attachments/") && n.endsWith(".png"))).toBe(true);
    expect(names).toContain("manifest.json");
  });

  it("导出的 Markdown 带 frontmatter,正文完整", async () => {
    const zipBytes = await buildExportZip(owner);
    const zip = await JSZip.loadAsync(zipBytes);
    const md = await zip.file(`notes/${noteSlug}.md`)!.async("string");
    expect(md.startsWith("---")).toBe(true);
    expect(md).toContain('"导出测试"');
    expect(md).toContain("# 私有笔记");
  });

  it("manifest 的数量与库中一致", async () => {
    const zipBytes = await buildExportZip(owner);
    const zip = await JSZip.loadAsync(zipBytes);
    const manifest = JSON.parse(await zip.file("manifest.json")!.async("string"));
    expect(manifest.notes).toBe(2);
    expect(manifest.attachments).toBe(1);
  });

  it("别的用户的附件不会被打进我的包里(多用户隔离)", async () => {
    const zipBytes = await buildExportZip(owner);
    const zip = await JSZip.loadAsync(zipBytes);
    const names = Object.keys(zip.files);
    expect(names.some((n) => n.includes("other-secret"))).toBe(false);
    // 自己的还在
    expect(names.some((n) => n.includes("test-export"))).toBe(true);
  });
});
