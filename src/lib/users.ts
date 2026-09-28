// 用户库:注册/查询。站点从"单站长"升级为"站长+注册用户"的社交站(决策记录见 DEVELOPMENT.md)。
// 密码一律 bcrypt 哈希;role: 'admin' = 站长,'user' = 注册用户。
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { siteSettings, users } from "@/db/schema";

export type SiteUser = {
  id: number;
  username: string;
  role: string;
  nickname: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};

export async function getUserByUsername(username: string): Promise<SiteUser | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return row ?? null;
}

export async function getUserById(id: number): Promise<SiteUser | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

/** 站长账号:第一个 admin 角色的用户;没有就找 username='admin';再没有就取第一个用户 */
export async function getAdminUser(): Promise<SiteUser | null> {
  const [admin] = await db
    .select()
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);
  if (admin) return admin;
  const [byName] = await db
    .select()
    .from(users)
    .where(eq(users.username, "admin"))
    .limit(1);
  if (byName) return byName;
  const [first] = await db.select().from(users).limit(1);
  return first ?? null;
}

export function isSiteAdmin(user: { role: string } | null) {
  return user?.role === "admin";
}

export async function isRegistrationOpen() {
  // 注册开关存 site_settings(allow_registration),默认开放;站长未来可关
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, "allow_registration"))
    .limit(1);
  return row?.value !== "0";
}

export async function registerUser(input: {
  username: string;
  password: string;
  nickname?: string;
}): Promise<SiteUser> {
  const username = input.username.trim();
  const nickname = (input.nickname ?? "").trim().slice(0, 20) || username;

  if (!/^[a-zA-Z0-9_\-\u4e00-\u9fa5]{2,20}$/.test(username)) {
    throw new Error("用户名要 2~20 位,只能是中英文、数字或下划线");
  }
  if (input.password.length < 6) {
    throw new Error("密码至少 6 位");
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (existing) throw new Error("用户名已被占用");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const [row] = await db
    .insert(users)
    .values({ username, passwordHash, nickname, role: "user" })
    .returning();
  return row;
}

/** 修改密码:验旧密码 → 存新哈希。新密码与注册同规(至少 6 位) */
export async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string,
) {
  if (newPassword.length < 6) throw new Error("新密码至少 6 位");
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) throw new Error("账号不存在");
  const valid = await bcrypt.compare(oldPassword, row.passwordHash);
  if (!valid) throw new Error("旧密码不对");
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

/** 内容归属判定:null(历史内容)视为站长的 */
export function isOwner(rowUserId: number | null, user: SiteUser) {
  if (rowUserId === null) return isSiteAdmin(user);
  return rowUserId === user.id;
}
