// 好友系统:双向确认制(参考微信)——A 发申请,B 同意后成为好友。
// 关系可升级:friend 好友 → best 铁哥们 → love 恋爱(设置后双方可见)。
// 关系状态: none 无 | pending_out 我发出的 | pending_in 对方发来的 | friends 已是好友 | self 自己
import { and, desc, eq, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { friendships, users } from "@/db/schema";

export type FriendInfo = {
  friendshipId: number;
  type: string; // friend | best | love
  user: {
    id: number;
    username: string;
    nickname: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  createdAt: string;
};

export type RelationStatus = "none" | "pending_out" | "pending_in" | "friends" | "self";

export async function getRelationStatus(
  viewerId: number,
  targetId: number,
): Promise<{ status: RelationStatus; requestId: number | null }> {
  if (viewerId === targetId) return { status: "self", requestId: null };
  const [row] = await db
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, viewerId), eq(friendships.addresseeId, targetId)),
        and(eq(friendships.requesterId, targetId), eq(friendships.addresseeId, viewerId)),
      ),
    )
    .limit(1);
  if (!row) return { status: "none", requestId: null };
  if (row.status === "accepted") return { status: "friends", requestId: row.id };
  return {
    status: row.requesterId === viewerId ? "pending_out" : "pending_in",
    requestId: row.id,
  };
}

/** 发好友申请:不能加自己;已是好友或已有任一方在等待时拒绝重复申请 */
export async function sendFriendRequest(requesterId: number, targetId: number) {
  if (requesterId === targetId) throw new Error("不能添加自己为好友");
  const { status } = await getRelationStatus(requesterId, targetId);
  if (status === "friends") throw new Error("你们已经是好友了");
  if (status === "pending_out") throw new Error("申请已发送,等对方同意吧");
  if (status === "pending_in") throw new Error("对方已经向你发过申请了,去后台同意吧");

  await db.insert(friendships).values({ requesterId, addresseeId: targetId });
}

/** 同意申请(仅收件人可操作) */
export async function acceptRequest(requestId: number, userId: number) {
  const [row] = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, requestId))
    .limit(1);
  if (!row || row.addresseeId !== userId || row.status !== "pending") return null;
  const [updated] = await db
    .update(friendships)
    .set({ status: "accepted" })
    .where(eq(friendships.id, requestId))
    .returning();
  return updated ?? null;
}

/** 拒绝/撤回申请:直接删掉记录 */
export async function removeFriendship(requestId: number, userId: number) {
  const [row] = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, requestId))
    .limit(1);
  if (!row || (row.requesterId !== userId && row.addresseeId !== userId)) return null;
  await db.delete(friendships).where(eq(friendships.id, requestId));
  return row;
}

/** 升级关系类型:好友 → 铁哥们 / 恋爱(仅好友双方可设置) */
export async function setFriendType(
  requestId: number,
  type: string,
  userId: number,
) {
  if (!["friend", "best", "love"].includes(type)) {
    throw new Error("关系类型不合法");
  }
  const [row] = await db
    .select()
    .from(friendships)
    .where(eq(friendships.id, requestId))
    .limit(1);
  if (
    !row ||
    row.status !== "accepted" ||
    (row.requesterId !== userId && row.addresseeId !== userId)
  ) {
    return null;
  }
  const [updated] = await db
    .update(friendships)
    .set({ type })
    .where(eq(friendships.id, requestId))
    .returning();
  return updated ?? null;
}

/** 站长的恋爱关系(首页恋爱卡用):找站长名下 type='love' 的好友关系 */
export async function getLoveFriend(adminId: number): Promise<FriendInfo | null> {
  const [row] = await db
    .select({
      friendshipId: friendships.id,
      type: friendships.type,
      createdAt: friendships.createdAt,
      id: users.id,
      username: users.username,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.addresseeId, users.id))
    .where(
      and(
        eq(friendships.requesterId, adminId),
        eq(friendships.type, "love"),
        eq(friendships.status, "accepted"),
      ),
    )
    .orderBy(desc(friendships.createdAt))
    .limit(1);
  if (row) return toFriendInfo(row);
  // 对方发起的也查一下
  const [row2] = await db
    .select({
      friendshipId: friendships.id,
      type: friendships.type,
      createdAt: friendships.createdAt,
      id: users.id,
      username: users.username,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.requesterId, users.id))
    .where(
      and(
        eq(friendships.addresseeId, adminId),
        eq(friendships.type, "love"),
        eq(friendships.status, "accepted"),
      ),
    )
    .limit(1);
  return row2 ? toFriendInfo(row2) : null;
}

function toFriendInfo(row: {
  friendshipId: number;
  type?: string;
  id: number;
  username: string;
  nickname: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}): FriendInfo {
  return {
    friendshipId: row.friendshipId,
    type: row.type ?? "friend",
    user: {
      id: row.id,
      username: row.username,
      nickname: row.nickname,
      avatarUrl: row.avatarUrl,
      bio: row.bio,
    },
    createdAt: row.createdAt,
  };
}

/** 好友列表:已确认的双向关系(两条查询分别取"我发出的"和"我收到的") */
export async function listFriends(userId: number): Promise<FriendInfo[]> {
  const rows = await db
    .select({
      friendshipId: friendships.id,
      type: friendships.type,
      createdAt: friendships.createdAt,
      id: users.id,
      username: users.username,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(friendships)
    .innerJoin(
      users,
      or(
        and(eq(friendships.requesterId, userId), eq(users.id, friendships.addresseeId)),
        and(eq(friendships.addresseeId, userId), eq(users.id, friendships.requesterId)),
      ),
    )
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
      ),
    )
    .orderBy(desc(friendships.createdAt));
  return rows.map(toFriendInfo);
}

/** 收到的好友申请(待处理) */
export async function listIncomingRequests(userId: number): Promise<FriendInfo[]> {
  const rows = await db
    .select({
      friendshipId: friendships.id,
      type: friendships.type,
      createdAt: friendships.createdAt,
      id: users.id,
      username: users.username,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.requesterId, users.id))
    .where(and(eq(friendships.addresseeId, userId), eq(friendships.status, "pending")))
    .orderBy(desc(friendships.createdAt));
  return rows.map(toFriendInfo);
}

/** 我发出的申请(等待对方同意) */
export async function listOutgoingRequests(userId: number): Promise<FriendInfo[]> {
  const rows = await db
    .select({
      friendshipId: friendships.id,
      type: friendships.type,
      createdAt: friendships.createdAt,
      id: users.id,
      username: users.username,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
    })
    .from(friendships)
    .innerJoin(users, eq(friendships.addresseeId, users.id))
    .where(and(eq(friendships.requesterId, userId), eq(friendships.status, "pending")))
    .orderBy(desc(friendships.createdAt));
  return rows.map(toFriendInfo);
}

/** 待处理申请数(后台角标) */
export async function pendingRequestCount(userId: number) {
  const incoming = await listIncomingRequests(userId);
  return incoming.length;
}

/** 好友id集合(朋友圈/权限判断用) */
export async function friendIds(userId: number): Promise<number[]> {
  const friends = await listFriends(userId);
  return friends.map((f) => f.user.id);
}
