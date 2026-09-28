import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// M4b 集合模块功能测试:书签/路线/习惯/记账/时间线/导航链接 + 周报
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
process.env.BLOG_DB_PATH = path.join(tmpDir, "test.db");
process.env.BLOG_DATA_DIR = path.join(tmpDir, "data");

const { closeDb } = await import("../src/lib/db");
const usersLib = await import("../src/lib/users");
const collections = await import("../src/lib/collections");
const reportLib = await import("../src/lib/report");

const userA = await usersLib.registerUser({ username: "coll-a", password: "123456" });
const userB = await usersLib.registerUser({ username: "coll-b", password: "123456" });

afterAll(() => {
  closeDb();
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // Windows 句柄延迟,不影响结论
  }
});

describe("书签(C2)", () => {
  it("添加/删除;他人不能删除我的书签", async () => {
    const bookmark = await collections.addBookmark(userA, {
      title: "Next.js",
      url: "https://nextjs.org",
    });
    expect(await collections.listBookmarks(userA)).toHaveLength(1);
    await expect(
      collections.deleteBookmark(bookmark.id, userB),
    ).rejects.toThrow("只能操作自己的内容");
    expect(await collections.deleteBookmark(bookmark.id, userA)).not.toBeNull();
    expect(await collections.listBookmarks(userA)).toHaveLength(0);
  });

  it("非法网址被拒绝", async () => {
    await expect(
      collections.addBookmark(userA, { title: "x", url: "ftp://bad" }),
    ).rejects.toThrow("网址要以 http(s):// 开头");
  });
});

describe("学习路线(B7)", () => {
  it("创建路线/添加节点/勾选进度", async () => {
    const path = await collections.createPath(userA, { title: "前端路线" });
    await collections.addPathNode(path.id, userA, "学 HTML");
    await collections.addPathNode(path.id, userA, "学 CSS");
    const paths = await collections.listPaths(userA);
    expect(paths).toHaveLength(1);
    expect(paths[0].nodes).toHaveLength(2);

    await collections.togglePathNode(paths[0].nodes[0].id, userA);
    const after = await collections.listPaths(userA);
    expect(after[0].nodes.filter((n) => n.done)).toHaveLength(1);
  });

  it("他人不能删除我的路线", async () => {
    const path = await collections.createPath(userA, { title: "私密路线" });
    await expect(collections.deletePath(path.id, userB)).rejects.toThrow(
      "只能操作自己的内容",
    );
    await collections.deletePath(path.id, userA);
  });
});

describe("习惯打卡(C3)", () => {
  it("打卡/取消;连续天数统计", async () => {
    const habit = await collections.createHabit(userA, "每天阅读");
    const first = await collections.toggleHabitToday(habit.id, userA);
    expect(first!.checked).toBe(true);
    let habits = await collections.listHabitsWithStreak(userA);
    expect(habits[0].checkedToday).toBe(true);
    expect(habits[0].streak).toBeGreaterThanOrEqual(1);

    const second = await collections.toggleHabitToday(habit.id, userA);
    expect(second!.checked).toBe(false);
    habits = await collections.listHabitsWithStreak(userA);
    expect(habits[0].checkedToday).toBe(false);
  });

  it("他人不能动我的习惯", async () => {
    const habit = await collections.createHabit(userA, "专属习惯");
    try {
      expect(await collections.toggleHabitToday(habit.id, userB)).toBeNull();
      await collections.deleteHabit(habit.id, userA);
    } catch (e) {
      console.log("STACK:", (e as Error).stack);
      throw e;
    }
  });
});

describe("记账(C9)", () => {
  it("收入/支出记录与金额校验", async () => {
    await collections.addFinanceRecord(userA, {
      kind: "expense",
      amount: 12.5,
      category: "餐饮",
    });
    await collections.addFinanceRecord(userA, {
      kind: "income",
      amount: 100,
    });
    await expect(
      collections.addFinanceRecord(userA, { kind: "expense", amount: 0 }),
    ).rejects.toThrow("金额不合法");

    const records = await collections.listFinance(userA);
    expect(records).toHaveLength(2);
  });

  it("他人不能删除我的账目", async () => {
    const record = await collections.addFinanceRecord(userA, {
      kind: "expense",
      amount: 5,
    });
    await expect(collections.deleteFinance(record.id, userB)).rejects.toThrow(
      "只能操作自己的内容",
    );
  });
});

describe("时间线(B8)", () => {
  it("添加/删除大事记;日期格式校验", async () => {
    await expect(
      collections.addTimelineEvent(userA, { date: "bad", title: "x" }),
    ).rejects.toThrow("日期格式");
    const event = await collections.addTimelineEvent(userA, {
      date: "2026-09-28",
      title: "里程碑",
    });
    const list = await collections.listTimeline(userA);
    expect(list.map((e) => e.title)).toContain("里程碑");
    await collections.deleteTimelineEvent(event.id, userA);
    expect((await collections.listTimeline(userA)).map((e) => e.title)).not.toContain(
      "里程碑",
    );
  });
});

describe("导航页(C4)", () => {
  it("添加/删除分组链接", async () => {
    const link = await collections.addNavLink(userA, {
      name: "GitHub",
      url: "https://github.com",
      category: "开发",
    });
    const links = await collections.listNavLinks(userA);
    expect(links).toHaveLength(1);
    await expect(collections.deleteNavLink(link.id, userB)).rejects.toThrow(
      "只能操作自己的内容",
    );
    await collections.deleteNavLink(link.id, userA);
    expect(await collections.listNavLinks(userA)).toHaveLength(0);
  });
});

describe("周报(C5)", () => {
  it("汇总本周记录与收支", async () => {
    await collections.addFinanceRecord(userA, {
      kind: "expense",
      amount: 20,
      date: new Date().toISOString().slice(0, 10),
    });
    const report = await reportLib.buildWeeklyReport(userA);
    // 同文件其他测试也会产生支出,这里只断言下限
    expect(report.expense).toBeGreaterThanOrEqual(20);
    expect(report.weekStart).toBeDefined();
  });
});
