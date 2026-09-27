import Link from "next/link";

import FriendActions from "@/components/kb/FriendActions";
import { getSessionUser } from "@/lib/session";
import {
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
} from "@/lib/friends";

// 好友管理:处理申请 + 好友列表
export const dynamic = "force-dynamic";

export const metadata = { title: "好友" };

export default async function KbFriendsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const [friends, incoming, outgoing] = await Promise.all([
    listFriends(sessionUser.id),
    listIncomingRequests(sessionUser.id),
    listOutgoingRequests(sessionUser.id),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">好友</h1>
      <p className="mt-1 text-sm opacity-60">
        在朋友圈或用户主页可以发好友申请;同意后就是好友了。
      </p>

      {/* 收到的申请 */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          收到的申请({incoming.length})
        </h2>
        {incoming.length === 0 ? (
          <p className="mt-3 text-sm opacity-60">暂时没有新申请。</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {incoming.map((request) => (
              <li
                key={request.friendshipId}
                className="glass flex items-center justify-between gap-3 rounded-xl p-4"
              >
                <Link
                  href={`/u/${request.user.username}`}
                  className="flex min-w-0 items-center gap-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={request.user.avatarUrl || "/images/avatar-default.svg"}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {request.user.nickname ?? request.user.username}
                    </span>
                    <span className="block text-xs opacity-50">
                      @{request.user.username}
                    </span>
                  </span>
                </Link>
                <FriendActions
                  friendshipId={request.friendshipId}
                  target={request.user.nickname ?? request.user.username}
                  mode="incoming"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 我发出的申请 */}
      {outgoing.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">等待对方同意({outgoing.length})</h2>
          <ul className="mt-3 space-y-2">
            {outgoing.map((request) => (
              <li
                key={request.friendshipId}
                className="glass flex items-center justify-between gap-3 rounded-xl p-4"
              >
                <span className="min-w-0 truncate text-sm">
                  🙂 {request.user.nickname ?? request.user.username}
                </span>
                <FriendActions
                  friendshipId={request.friendshipId}
                  target={request.user.nickname ?? request.user.username}
                  mode="outgoing"
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 好友列表 */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">我的好友({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="mt-3 text-sm opacity-60">还没有好友,去朋友圈认识一些朋友吧。</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {friends.map((friend) => (
              <li
                key={friend.friendshipId}
                className="glass flex items-center justify-between gap-3 rounded-xl p-4"
              >
                <Link
                  href={`/u/${friend.user.username}`}
                  className="flex min-w-0 items-center gap-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={friend.user.avatarUrl || "/images/avatar-default.svg"}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {friend.user.nickname ?? friend.user.username}
                    </span>
                    <span className="block text-xs opacity-50">
                      @{friend.user.username}
                      {friend.user.bio ? ` · ${friend.user.bio}` : ""}
                    </span>
                  </span>
                </Link>
                <FriendActions
                  friendshipId={friend.friendshipId}
                  target={friend.user.nickname ?? friend.user.username}
                  mode="friend"
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
