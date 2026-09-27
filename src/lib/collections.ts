// M4b 记录集合:书签(C2)/学习路线(B7)/时间线(B8)/习惯打卡(C3)/记账(C9)/导航页(C4)。
// 全部为"归属用户的简单 CRUD",统一模式:写入口校验,读取带归属过滤。
import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  bookmarks,
  financeRecords,
  habitChecks,
  habits,
  learningPaths,
  navLinks,
  pathNodes,
  timelineEvents,
} from "@/db/schema";
import type { SiteUser } from "./users";

function requireSelf(rowUserId: number, user: SiteUser) {
  if (rowUserId !== user.id && user.role !== "admin") {
    throw new Error("只能操作自己的内容");
  }
}

// ===== 书签(C2) =====
export async function listBookmarks(user: SiteUser) {
  return db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, user.id))
    .orderBy(desc(bookmarks.createdAt));
}

export async function addBookmark(
  user: SiteUser,
  input: { title: string; url: string; description?: string },
) {
  const url = input.url.trim();
  if (!/^https?:\/\//i.test(url)) throw new Error("网址要以 http(s):// 开头");
  const [row] = await db
    .insert(bookmarks)
    .values({
      userId: user.id,
      title: input.title.trim().slice(0, 100),
      url: url.slice(0, 500),
      description: input.description?.slice(0, 200) ?? null,
    })
    .returning();
  return row;
}

export async function deleteBookmark(id: number, user: SiteUser) {
  const [row] = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.id, id))
    .limit(1);
  if (!row) return null;
  requireSelf(row.userId, user);
  await db.delete(bookmarks).where(eq(bookmarks.id, id));
  return row;
}

// ===== 学习路线(B7) =====
export type PathWithNodes = {
  id: number;
  title: string;
  description: string | null;
  nodes: { id: number; title: string; done: number }[];
};

export async function listPaths(user: SiteUser): Promise<PathWithNodes[]> {
  const paths = await db
    .select()
    .from(learningPaths)
    .where(eq(learningPaths.userId, user.id))
    .orderBy(desc(learningPaths.createdAt));
  const result: PathWithNodes[] = [];
  for (const path of paths) {
    const nodes = await db
      .select()
      .from(pathNodes)
      .where(eq(pathNodes.pathId, path.id))
      .orderBy(pathNodes.sortOrder);
    result.push({
      id: path.id,
      title: path.title,
      description: path.description,
      nodes: nodes.map((n) => ({ id: n.id, title: n.title, done: n.done })),
    });
  }
  return result;
}

export async function createPath(
  user: SiteUser,
  input: { title: string; description?: string },
) {
  const [row] = await db
    .insert(learningPaths)
    .values({
      userId: user.id,
      title: input.title.trim().slice(0, 80),
      description: input.description?.slice(0, 300) ?? null,
    })
    .returning();
  return row;
}

export async function deletePath(pathId: number, user: SiteUser) {
  const [path] = await db
    .select()
    .from(learningPaths)
    .where(eq(learningPaths.id, pathId))
    .limit(1);
  if (!path) return null;
  requireSelf(path.userId, user);
  const nodes = await db
    .select({ id: pathNodes.id })
    .from(pathNodes)
    .where(eq(pathNodes.pathId, pathId));
  for (const node of nodes) {
    await db.delete(pathNodes).where(eq(pathNodes.id, node.id));
  }
  await db.delete(learningPaths).where(eq(learningPaths.id, pathId));
  return path;
}

export async function addPathNode(
  pathId: number,
  user: SiteUser,
  title: string,
) {
  const [path] = await db
    .select()
    .from(learningPaths)
    .where(eq(learningPaths.id, pathId))
    .limit(1);
  if (!path) throw new Error("路线不存在");
  requireSelf(path.userId, user);
  const max = await db
    .select({ max: sql<number>`coalesce(max(sort_order), 0)` })
    .from(pathNodes)
    .where(eq(pathNodes.pathId, pathId));
  const [row] = await db
    .insert(pathNodes)
    .values({
      pathId,
      title: title.trim().slice(0, 100),
      sortOrder: (max[0]?.max ?? 0) + 1,
    })
    .returning();
  return row;
}

export async function togglePathNode(nodeId: number, user: SiteUser) {
  const [node] = await db
    .select()
    .from(pathNodes)
    .where(eq(pathNodes.id, nodeId))
    .limit(1);
  if (!node) return null;
  const [path] = await db
    .select()
    .from(learningPaths)
    .where(eq(learningPaths.id, node.pathId))
    .limit(1);
  requireSelf(path.userId, user);
  const [updated] = await db
    .update(pathNodes)
    .set({ done: node.done ? 0 : 1 })
    .where(eq(pathNodes.id, nodeId))
    .returning();
  return updated;
}

// ===== 成长时间线(B8) =====
export async function listTimeline(user: SiteUser) {
  return db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.userId, user.id))
    .orderBy(desc(timelineEvents.date));
}

export async function addTimelineEvent(
  user: SiteUser,
  input: { date: string; title: string; content?: string },
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error("日期格式应为 YYYY-MM-DD");
  }
  const [row] = await db
    .insert(timelineEvents)
    .values({
      userId: user.id,
      date: input.date,
      title: input.title.trim().slice(0, 100),
      content: input.content?.slice(0, 1000) ?? null,
    })
    .returning();
  return row;
}

export async function deleteTimelineEvent(id: number, user: SiteUser) {
  const [row] = await db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.id, id))
    .limit(1);
  if (!row) return null;
  requireSelf(row.userId, user);
  await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
  return row;
}

// ===== 习惯打卡(C3) =====
export type HabitWithStreak = {
  id: number;
  name: string;
  streak: number;
  checkedToday: boolean;
  recent: { date: string; done: boolean }[];
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function listHabitsWithStreak(
  user: SiteUser,
): Promise<HabitWithStreak[]> {
  const myHabits = await db
    .select({ id: habits.id, name: habits.name })
    .from(habits)
    .where(eq(habits.userId, user.id))
    .orderBy(habits.id);
  const today = todayStr();
  const result: HabitWithStreak[] = [];
  for (const habit of myHabits) {
    const checks = await db
      .select({ date: habitChecks.date })
      .from(habitChecks)
      .where(eq(habitChecks.habitId, habit.id))
      .orderBy(desc(habitChecks.date));
    const dates = new Set(checks.map((c) => c.date));
    // 连续天数:从今天(或昨天)往前数
    let streak = 0;
    const cursor = new Date();
    if (!dates.has(cursor.toISOString().slice(0, 10))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (dates.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    result.push({
      id: habit.id,
      name: habit.name,
      streak,
      checkedToday: dates.has(today),
      recent: checks.slice(0, 7).map((c) => ({ date: c.date, done: true })),
    });
  }
  return result;
}

export async function createHabit(user: SiteUser, name: string) {
  const [row] = await db
    .insert(habits)
    .values({ userId: user.id, name: name.trim().slice(0, 30) })
    .returning();
  return row;
}

export async function toggleHabitToday(habitId: number, user: SiteUser) {
  const [habit] = await db
    .select({ id: habits.id, userId: habits.userId, name: habits.name })
    .from(habits)
    .where(eq(habits.id, habitId))
    .limit(1);
  if (!habit || habit.userId !== user.id) return null;
  const today = todayStr();
  const [existing] = await db
    .select({ date: habitChecks.date })
    .from(habitChecks)
    .where(and(eq(habitChecks.habitId, habitId), eq(habitChecks.date, today)))
    .limit(1);
  if (existing) {
    await db
      .delete(habitChecks)
      .where(and(eq(habitChecks.habitId, habitId), eq(habitChecks.date, today)));
    return { checked: false };
  }
  await db.insert(habitChecks).values({ habitId, date: today });
  return { checked: true };
}

export async function deleteHabit(habitId: number, user: SiteUser) {
  const [habit] = await db
    .select({ userId: habits.userId })
    .from(habits)
    .where(eq(habits.id, habitId))
    .limit(1);
  if (!habit || habit.userId !== user.id) return null;
  // habit_checks 无独立 id,整批按 habitId 清除
  await db.delete(habitChecks).where(eq(habitChecks.habitId, habitId));
  await db.delete(habits).where(eq(habits.id, habitId));
  return habit;
}

// ===== 记账(C9) =====
export type FinanceRecord = typeof financeRecords.$inferSelect;

export async function addFinanceRecord(
  user: SiteUser,
  input: {
    kind: "income" | "expense";
    amount: number; // 元
    category?: string;
    note?: string;
    date?: string;
  },
) {
  const amount = Math.round(Number(input.amount) * 100);
  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error("金额不合法");
  }
  const [row] = await db
    .insert(financeRecords)
    .values({
      userId: user.id,
      kind: input.kind === "income" ? "income" : "expense",
      amount: Math.abs(amount),
      category: input.category?.slice(0, 30) ?? null,
      note: input.note?.slice(0, 200) ?? null,
      date: input.date ?? new Date().toISOString().slice(0, 10),
    })
    .returning();
  return row;
}

export async function listFinance(
  user: SiteUser,
): Promise<FinanceRecord[]> {
  return db
    .select({
      id: financeRecords.id,
      kind: financeRecords.kind,
      amount: financeRecords.amount,
      category: financeRecords.category,
      note: financeRecords.note,
      date: financeRecords.date,
      userId: financeRecords.userId,
      createdAt: financeRecords.createdAt,
    })
    .from(financeRecords)
    .where(eq(financeRecords.userId, user.id))
    .orderBy(desc(financeRecords.date), desc(financeRecords.id))
    .limit(200);
}

export async function deleteFinance(id: number, user: SiteUser) {
  const [row] = await db
    .select()
    .from(financeRecords)
    .where(eq(financeRecords.id, id))
    .limit(1);
  if (!row) return null;
  requireSelf(row.userId, user);
  await db.delete(financeRecords).where(eq(financeRecords.id, id));
  return row;
}

// ===== 导航页(C4) =====
export type NavLink = typeof navLinks.$inferSelect;

export async function listNavLinks(user: SiteUser): Promise<NavLink[]> {
  return db
    .select()
    .from(navLinks)
    .where(eq(navLinks.userId, user.id))
    .orderBy(navLinks.sortOrder, navLinks.id);
}

export async function addNavLink(
  user: SiteUser,
  input: { name: string; url: string; category?: string },
) {
  const url = input.url.trim();
  if (!/^https?:\/\//i.test(url)) throw new Error("网址要以 http(s):// 开头");
  const [row] = await db
    .insert(navLinks)
    .values({
      userId: user.id,
      name: input.name.trim().slice(0, 50),
      url: url.slice(0, 500),
      category: input.category?.trim().slice(0, 30) || "常用",
    })
    .returning();
  return row;
}

export async function deleteNavLink(id: number, user: SiteUser) {
  const [row] = await db
    .select()
    .from(navLinks)
    .where(eq(navLinks.id, id))
    .limit(1);
  if (!row) return null;
  requireSelf(row.userId, user);
  await db.delete(navLinks).where(eq(navLinks.id, id));
  return row;
}
