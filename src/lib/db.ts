import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import * as schema from "../db/schema";

// 数据库文件统一放在 <项目根>/data/ 下;该目录不入 git,备份脚本只针对它
const DATA_DIR = path.join(process.cwd(), "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const sqlite = new Database(path.join(DATA_DIR, "blog.db"));
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// 应用启动时自动执行未落库的迁移,保证代码与表结构一致
migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
