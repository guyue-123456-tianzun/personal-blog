// 备份脚本:数据库 + 附件打包到 backups/(服务器上建议再用 cron 每日执行 + OSS 上传)。
// 用法:node scripts/backup.mjs
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
const backupDir = path.join(process.cwd(), "backups");
fs.mkdirSync(backupDir, { recursive: true });

// 1. 数据库在线备份(better-sqlite3 自带 backup API,不锁库)
const db = new Database(path.join(process.cwd(), "data", "blog.db"));
const dbBackupPath = path.join(backupDir, `blog-${stamp}.db`);
await db.backup(dbBackupPath);
db.close();
console.log(`✅ 数据库已备份: ${dbBackupPath}`);

// 2. 附件目录打包(存在才打包)
const uploadsDir = path.join(process.cwd(), "data", "uploads");
if (fs.existsSync(uploadsDir)) {
  const { execSync } = await import("node:child_process");
  const tarPath = path.join(backupDir, `uploads-${stamp}.tar.gz`);
  execSync(`tar -czf "${tarPath}" -C "${path.join(process.cwd(), "data")}" uploads`);
  console.log(`✅ 附件已备份: ${tarPath}`);
}

// 3. 清理 15 天前的旧备份
const cutoff = Date.now() - 15 * 86_400_000;
for (const file of fs.readdirSync(backupDir)) {
  const full = path.join(backupDir, file);
  if (fs.statSync(full).mtimeMs < cutoff) {
    fs.rmSync(full, { force: true });
    console.log(`🧹 清理过期备份: ${file}`);
  }
}
