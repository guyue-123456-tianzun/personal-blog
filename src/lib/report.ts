// 周报(C5):自动汇总最近 7 天的记录(笔记/说说/日记/打卡/收支/收到的评论)。
// 只读汇总,不做新表。
import { and, count, desc, eq, gte, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { comments, financeRecords, habitChecks, habits, notes } from "@/db/schema";
import type { SiteUser } from "./users";

export type WeeklyReport = {
  weekStart: string;
  weekEnd: string;
  noteCount: number;
  momentCount: number;
  diaryCount: number;
  wordsWritten: number;
  habitCheckCount: number;
  income: number; // 元
  expense: number; // 元
  commentCount: number;
  items: { date: string; title: string; type: string }[];
};

export async function buildWeeklyReport(user: SiteUser): Promise<WeeklyReport> {
  const now = new Date();
  const weekStartDate = new Date(now);
  weekStartDate.setDate(now.getDate() - 6);
  weekStartDate.setHours(0, 0, 0, 0);
  const weekStart = weekStartDate.toISOString().slice(0, 10);

  const rows = await db
    .select({
      id: notes.id,
      type: notes.type,
      title: notes.title,
      content: notes.content,
      createdAt: notes.createdAt,
    })
    .from(notes)
    .where(
      and(
        eq(notes.userId, user.id),
        isNull(notes.deletedAt),
        gte(notes.createdAt, weekStart),
      ),
    )
    .orderBy(desc(notes.createdAt));

  const [checkRow] = await db
    .select({ c: count() })
    .from(habitChecks)
    .innerJoin(habits, eq(habitChecks.habitId, habits.id))
    .where(and(eq(habits.userId, user.id), gte(habitChecks.date, weekStart)));

  const moneyRows = await db
    .select({ kind: financeRecords.kind, amount: financeRecords.amount })
    .from(financeRecords)
    .where(
      and(eq(financeRecords.userId, user.id), gte(financeRecords.date, weekStart)),
    );

  // 收到的评论数(评论挂在站长文章的 slug 上)
  const myPosts = await db
    .select({ slug: notes.slug })
    .from(notes)
    .where(and(eq(notes.userId, user.id), eq(notes.type, "post")));
  let commentCount = 0;
  for (const post of myPosts) {
    const rowsC = await db
      .select({ id: comments.id })
      .from(comments)
      .where(and(eq(comments.postSlug, post.slug), gte(comments.createdAt, weekStart)));
    commentCount += rowsC.length;
  }

  let income = 0;
  let expense = 0;
  for (const row of moneyRows) {
    if (row.kind === "income") income += row.amount;
    else expense += row.amount;
  }

  const items = rows.map((row) => ({
    date: row.createdAt.slice(0, 10),
    title: row.title,
    type: row.type,
  }));

  return {
    weekStart,
    weekEnd: now.toISOString().slice(0, 10),
    noteCount: items.filter((i) => i.type === "note").length,
    momentCount: items.filter((i) => i.type === "moment").length,
    diaryCount: items.filter((i) => i.type === "diary").length,
    wordsWritten: rows.reduce((sum, row) => sum + row.content.length, 0),
    habitCheckCount: checkRow.c,
    income,
    expense,
    commentCount,
    items,
  };
}
