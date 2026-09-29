import Link from "next/link";

import BuddiesClient, {
  type BuddyItem,
  type RequestItem,
} from "@/components/public/BuddiesClient";
import { PublicShell } from "@/components/public/PublicShell";
import {
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
} from "@/lib/friends";
import { getSessionUser } from "@/lib/session";

// 好友独立前台页(2026-09-09 站长拍板:好友功能从知识库后台拿出来单独做)。
// 好友关系是私有数据(只有双方可见),页面按登录态渲染:
// 登录用户看自己的好友卡+申请管理,访客看引导卡——不进 middleware 守卫,避免整页 307。
export const dynamic = "force-dynamic";

export const metadata = { title: "我的好友" };

export default async function BuddiesPage() {
  const user = await getSessionUser();

  return (
    <PublicShell>
      <h1 className="text-2xl font-bold">我的好友</h1>
      <p className="mt-2 text-sm opacity-60">
        加好友、升级关系(铁哥们/恋爱)、处理申请——都在这一页。
      </p>

      {!user ? (
        <div className="glass mt-8 rounded-2xl p-8 text-center">
          <p className="text-3xl">🤝</p>
          <p className="mt-3 text-sm leading-6 opacity-70">
            登录之后就能加好友、处理申请、升级关系。
            <br />
            好友关系只有你们双方可见。
          </p>
          <Link
            href="/?login=1&next=/buddies"
            className="mt-4 inline-block rounded-full bg-accent px-6 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            登录 / 注册
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <BuddiesData />
        </div>
      )}
    </PublicShell>
  );
}

// 取数拆一层 async 组件:未登录路径完全不碰数据库
async function BuddiesData() {
  const user = await getSessionUser();
  if (!user) return null;

  const [buddies, incoming, outgoing] = await Promise.all([
    listFriends(user.id),
    listIncomingRequests(user.id),
    listOutgoingRequests(user.id),
  ]);

  // FriendInfo 统一结构:user = 对方(收到的申请里是申请人,发出的申请里是等待同意的人)
  const toRequest = (req: (typeof incoming)[number]): RequestItem => ({
    id: req.friendshipId,
    user: {
      username: req.user.username,
      nickname: req.user.nickname,
      avatarUrl: req.user.avatarUrl,
    },
    createdAt: req.createdAt,
  });
  const incomingItems = incoming.map(toRequest);
  const outgoingItems = outgoing.map(toRequest);

  const buddyItems: BuddyItem[] = buddies.map((buddy) => ({
    friendshipId: buddy.friendshipId,
    type: buddy.type,
    user: {
      id: buddy.user.id,
      username: buddy.user.username,
      nickname: buddy.user.nickname,
      avatarUrl: buddy.user.avatarUrl,
      bio: buddy.user.bio,
    },
    createdAt: buddy.createdAt,
  }));

  return (
    <BuddiesClient buddies={buddyItems} incoming={incomingItems} outgoing={outgoingItems} />
  );
}
