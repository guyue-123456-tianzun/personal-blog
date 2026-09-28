import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// 会话层 / 附件归属 / 剪藏校验 / 知识图谱 的功能测试。
// 重点是"多用户下谁都动不了别人的东西"这条边界——本次全站体检修的就是它。
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
process.env.BLOG_DATA_DIR = path.join(tmpDir, "data");
process.env.AUTH_SECRET = "test-secret-for-vitest-only";

// 让 session.ts 里的 cookies() 可控:改 state.token 即可模拟"带/不带会话 cookie"
const state = vi.hoisted(() => ({ token: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: () =>
      state.token ? { name: "kb_session", value: state.token } : undefined,
  }),
}));

const { db, closeDb } = await import("../src/lib/db");
const { notes, users } = await import("../src/db/schema");
const { createSessionToken } = await import("../src/lib/auth");
const { getSessionUser } = await import("../src/lib/session");
const { registerUser } = await import("../src/lib/users");
const {
  canManageAttachment,
  deleteAttachment,
  getAttachment,
  resolveStored,
  saveUpload,
} = await import("../src/lib/attachments");
const { clipUrl } = await import("../src/lib/clips");
const { buildGraph, extractWikiLinks } = await import("../src/lib/graph");
const { extractToc, slugId } = await import("../src/lib/toc");

let admin: Awaited<ReturnType<typeof registerUser>>;
let alice: Awaited<ReturnType<typeof registerUser>>;
let bob: Awaited<ReturnType<typeof registerUser>>;

beforeAll(async () => {
  const [adminRow] = await db
    .insert(users)
    .values({ username: "boss", passwordHash: "x", role: "admin" })
    .returning();
  admin = adminRow;
  alice = await registerUser({ username: "alice-kb", password: "123456" });
  bob = await registerUser({ username: "bob-kb", password: "123456" });

  await db.insert(notes).values([
    { type: "note", slug: "kb-a", title: "路线图", content: "见 [[读书清单]] 与 [[复盘]]。再提一次 [[读书清单]]。", userId: alice.id },
    { type: "note", slug: "kb-b", title: "读书清单", content: "月度书单。", userId: alice.id },
    { type: "note", slug: "kb-c", title: "Bob 的私密笔记", content: "不该出现在 alice 的图里。", userId: bob.id },
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

describe("会话层 session.ts", () => {
  it("带上合法令牌能取到当前用户", async () => {
    const [payload, signature] = await createSessionToken(alice.username);
    state.token = `${payload}.${signature}`;
    const user = await getSessionUser();
    expect(user?.username).toBe(alice.username);
    expect(user?.id).toBe(alice.id);
  });

  it("没有 cookie 就是未登录", async () => {
    state.token = undefined;
    expect(await getSessionUser()).toBeNull();
  });

  it("乱填的令牌取不到用户(不会崩)", async () => {
    state.token = "garbage";
    expect(await getSessionUser()).toBeNull();
    state.token = "a.b.c";
    expect(await getSessionUser()).toBeNull();
  });

  it("令牌对应的人已被删掉,也算未登录", async () => {
    const [payload, signature] = await createSessionToken("已经不在的用户");
    state.token = `${payload}.${signature}`;
    expect(await getSessionUser()).toBeNull();
    state.token = undefined;
  });
});

describe("附件归属 attachments.ts", () => {
  it("上传时记下归属人,文件真的落到磁盘上", async () => {
    const file = new File([new Uint8Array([1, 2, 3, 4])], "pic.png", {
      type: "image/png",
    });
    const row = await saveUpload(file, null, 1, alice.id);
    expect(row.userId).toBe(alice.id);
    expect(row.isPublic).toBe(1);
    expect(fs.existsSync(resolveStored(row.storedPath))).toBe(true);

    const fetched = await getAttachment(row.id);
    expect(fetched?.filename).toBe("pic.png");
  });

  it("归属判定:自己的能管,别人的不能管", () => {
    expect(canManageAttachment({ userId: alice.id }, alice)).toBe(true);
    expect(canManageAttachment({ userId: alice.id }, bob)).toBe(false);
  });

  it("没有归属人的老附件归站长,普通用户碰不到", () => {
    expect(canManageAttachment({ userId: null }, admin)).toBe(true);
    expect(canManageAttachment({ userId: null }, alice)).toBe(false);
  });

  it("删除时记录和文件一起清掉", async () => {
    const file = new File([new Uint8Array([9])], "gone.png", {
      type: "image/png",
    });
    const row = await saveUpload(file, null, 0, alice.id);
    const full = resolveStored(row.storedPath);
    await deleteAttachment(row.id);
    expect(await getAttachment(row.id)).toBeNull();
    expect(fs.existsSync(full)).toBe(false);
  });
});

describe("网页剪藏 clips.ts 的入参校验", () => {
  it("非 http(s) 的地址一律拒绝", async () => {
    await expect(clipUrl("ftp://example.com", alice)).rejects.toThrow(
      "URL 必须以 http(s):// 开头",
    );
    await expect(clipUrl("javascript:alert(1)", alice)).rejects.toThrow(
      "URL 必须以 http(s):// 开头",
    );
    await expect(clipUrl("", alice)).rejects.toThrow(
      "URL 必须以 http(s):// 开头",
    );
  });
});

describe("知识图谱 graph.ts", () => {
  it("从正文里抽出 [[双向链接]]", () => {
    expect(extractWikiLinks("看 [[读书清单]] 和 [[复盘]]")).toEqual([
      "读书清单",
      "复盘",
    ]);
    expect(extractWikiLinks("没有链接")).toEqual([]);
  });

  it("按标题把节点连起来,重复链接只连一条线,找不到的标题不造节点", async () => {
    const graph = await buildGraph(alice);

    // [[复盘]] 没有对应笔记,不该凭空造出节点
    expect(graph.nodes.map((n) => n.label).sort()).toEqual(
      ["读书清单", "路线图"].sort(),
    );

    const roadmap = graph.nodes.find((n) => n.label === "路线图")!;
    const bookList = graph.nodes.find((n) => n.label === "读书清单")!;
    expect(graph.edges).toEqual([
      { from: roadmap.id, to: bookList.id, label: "读书清单" },
    ]);
  });

  it("图谱只看得到自己的内容", async () => {
    const graph = await buildGraph(bob);
    expect(graph.nodes.map((n) => n.label)).toEqual(["Bob 的私密笔记"]);
    expect(graph.edges).toEqual([]);
  });
});

describe("文章目录 lib/toc.ts", () => {
  it("抽出标题,并跳过代码块里的 # 注释", () => {
    const markdown = [
      "# 文章标题",
      "## 第一节",
      "```js",
      "# 这是代码注释,不是标题",
      "```",
      "### 小节",
    ].join("\n");
    expect(extractToc(markdown).map((i) => `${i.level}:${i.text}`)).toEqual([
      "1:文章标题",
      "2:第一节",
      "3:小节",
    ]);
  });

  it("目录锚点与正文标题共用同一套 id 规则(否则点了跳不过去)", () => {
    const markdown = "## 技术栈\n### 代码高亮长这样\n";
    const toc = extractToc(markdown);
    // 正文渲染时也是用 slugId(标题文字) 生成 id,两边必须一致
    expect(toc.map((i) => i.id)).toEqual([
      slugId("技术栈"),
      slugId("代码高亮长这样"),
    ]);
    // 同一个标题两次调用结果必须相同
    expect(slugId("技术栈")).toBe(slugId("技术栈"));
  });

  it("纯符号标题也有兜底 id,不会生成空锚点", () => {
    expect(slugId("!!!")).toBe("h-section");
    expect(slugId("   ")).toBe("h-section");
  });
});
