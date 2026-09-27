import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// M0 只建站长账号表;内容表(notes / tags / attachments …)在 M2 里程碑按
// docs/DEVELOPMENT.md 第 5 节的数据设计扩展,改表一律走 drizzle-kit generate 迁移
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // 注意:SQLite 的 DEFAULT 子句要求函数调用必须包在括号里,裸写 datetime('now') 会报语法错误
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;
