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
  // role 必须是 admin:全站的归属判定(isOwner / requireSelf / kbOwnerFilter)都靠它区分
  // "站长"和"注册用户"。以前这里没写 role,新账号只会拿到默认的 'user',
  // 结果站长管不了自己 userId 为空的早期内容,知识库列表也会是空的。
  // 同一个账号再跑一次这个脚本,会顺手把角色补正。
  db.insert(users)
    .values({ username, passwordHash, role: "admin" })
    .onConflictDoUpdate({
      target: users.username,
      set: { passwordHash, role: "admin" },
    })
    .run();
  console.log(`✅ 站长账号「${username}」已创建/更新(角色 admin)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 创建失败:", error);
    process.exit(1);
  });
