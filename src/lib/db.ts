import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import * as schema from "../db/schema";

// 数据库文件默认放 <项目根>/data/blog.db(该目录不入 git,备份只针对它);
// 测试通过 BLOG_DB_PATH 环境变量指到临时库,保证测试永不碰真实数据
const DB_PATH = process.env.BLOG_DB_PATH
  ? path.resolve(process.env.BLOG_DB_PATH)
  : path.join(process.cwd(), "data", "blog.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// 应用启动时自动执行未落库的迁移,保证代码与表结构一致。
// 注意:构建时多个页面会并行初始化本模块,可能同时执行同一个新迁移,
// 后来者会撞 "table already exists" —— 这说明迁移已被并发方完成,不算错误;其余错误照常抛出
try {
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
} catch (error) {
  const text =
    (error instanceof Error ? error.message : String(error)) +
    (error instanceof Error && error.cause instanceof Error
      ? error.cause.message
      : "");
  if (!/already exists/i.test(text)) throw error;
}

/** 供测试与优雅停机使用 */
export function closeDb() {
  sqlite.close();
}
