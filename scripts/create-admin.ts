// 创建/重置站长账号:npm run db:seed -- <用户名> <密码>
import bcrypt from "bcryptjs";

import { db } from "../src/lib/db";
import { users } from "../src/db/schema";

async function main() {
  const username = process.argv[2] ?? process.env.ADMIN_USERNAME;
  const password = process.argv[3] ?? process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.error(
      "用法:npm run db:seed -- <用户名> <密码>(或设置 ADMIN_USERNAME / ADMIN_PASSWORD 环境变量)",
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  db.insert(users)
    .values({ username, passwordHash })
    .onConflictDoUpdate({ target: users.username, set: { passwordHash } })
    .run();
  console.log(`✅ 站长账号「${username}」已创建/更新`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 创建失败:", error);
    process.exit(1);
  });
