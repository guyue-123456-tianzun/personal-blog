import Link from "next/link";
import { notFound } from "next/navigation";

import FriendButton from "@/components/social/FriendButton";
import MomentImages from "@/components/social/MomentImages";
import { listPublicMoments } from "@/lib/content-api";
import { getRelationStatus } from "@/lib/friends";
import { getSessionUser } from "@/lib/session";
import { getSiteAvatar } from "@/lib/settings";
import { getUserByUsername } from "@/lib/users";

// 用户主页:公开形象(头像/昵称/简介) + 公开动态 + 加好友入口
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ username: string }> };

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  const target = await getUserByUsername(decodeURIComponent(username));
  if (!target) notFound();

  const sessionUser = await getSessionUser();
  const isSelf = sessionUser?.id === target.id;
  const relation =
    sessionUser && !isSelf
      ? await getRelationStatus(sessionUser.id, target.id)
      : { status: "none" as const, requestId: null };

  const moments = await listPublicMoments(20, 0, target.username);
  // 站长头像以"外观设置"里那张为准(users 表的头像没有编辑入口,历来为空);
  // 只看 users.avatarUrl 的话,站长换完头像这里还是默认图
  const avatar =
    target.avatarUrl ??
    (target.role === "admin" ? await getSiteAvatar() : null) ??
    "/images/avatar-default.svg";
  const displayName = target.nickname ?? target.username;

  return (
    <main className="mx-auto max-w-2xl px-4 pt-24 pb-10 sm:px-6">
      {/* 资料卡:头像与站内保持同一套视觉语言(大号圆角方块) */}
      <section className="glass rounded-2xl p-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar}
          alt=""
          className="mx-auto aspect-square w-36 rounded-[28px] object-cover shadow-lg ring-1 ring-white/50"
        />
        <h1 className="mt-4 text-2xl font-bold">{displayName}</h1>
        <span className="mx-auto mt-2 block h-[3px] w-7 rounded-full bg-accent" />
        <p className="mt-2 text-xs opacity-50">@{target.username}</p>
        {target.bio && <p className="mt-2 text-sm opacity-70">{target.bio}</p>}
        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <span className="opacity-70">📝 公开动态 {moments.length} 条</span>
        </div>
        <div className="mt-4 flex justify-center">
          {isSelf ? (
            <Link
              href="/settings"
              className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:bg-foreground/10"
            >
              进入设置
            </Link>
          ) : (
            <FriendButton
              targetUsername={target.username}
              initialStatus={relation.status}
              loggedIn={!!sessionUser}
            />
          )}
        </div>
      </section>

      {/* 公开动态 */}
      <h2 className="mt-10 text-lg font-bold">TA 的公开动态</h2>
      {moments.length === 0 ? (
        <p className="mt-3 text-sm opacity-60">还没有公开动态。</p>
      ) : (
        <div className="mt-3 space-y-4">
          {moments.map((moment) => (
            <article key={moment.id} className="glass rounded-2xl p-5">
              <p className="whitespace-pre-wrap text-[15px] leading-7">
                {moment.content}
              </p>
              <MomentImages
                images={moment.images.map((image) => ({ id: image.id, url: image.url }))}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs opacity-50">
                <time>{moment.createdAt.slice(0, 16)}</time>
                <span className="flex gap-1.5">
                  {moment.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-border px-2 py-0.5">
                      #{tag}
                    </span>
                  ))}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
