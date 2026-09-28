"use client";

import Link from "next/link";
import { useState } from "react";

import FriendButton from "@/components/social/FriendButton";
import MomentImages from "@/components/social/MomentImages";

export type FeedMoment = {
  id: number;
  content: string;
  createdAt: string;
  tags: string[];
  images: { id: number; url: string }[];
  author: {
    id: number;
    username: string;
    nickname: string | null;
    avatarUrl: string | null;
  };
};

type Relation = "none" | "pending_out" | "pending_in" | "friends" | "self";

type Props = {
  moments: FeedMoment[];
  sessionUsername: string | null;
  relations: Record<string, { status: Relation; requestId: number | null }>;
};

// 朋友圈卡片流:随机刷新按钮打乱顺序,像刷朋友圈一样遇到不同用户;
// 每张卡片带作者头像/昵称(指向用户主页)和加好友按钮。
export default function MomentsFeed({ moments, sessionUsername, relations }: Props) {
  const [shuffled, setShuffled] = useState(false);
  const [order, setOrder] = useState<momentKey[]>(() =>
    moments.map((_, i) => i),
  );

  type momentKey = number;

  function shuffle() {
    setShuffled(true);
    setOrder((current) => {
      const next = [...current];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  }

  const list = shuffled
    ? order.map((i) => moments[i]).filter(Boolean)
    : moments;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm opacity-60">共 {moments.length} 条公开动态</p>
        <button
          onClick={shuffle}
          className="rounded-full border border-border px-3.5 py-1.5 text-xs transition-colors hover:bg-foreground/10"
        >
          🔄 随机刷新
        </button>
      </div>

      {list.map((moment) => {
        const isSelf = moment.author.username === sessionUsername;
        const relation = relations[moment.author.username]?.status ?? "none";
        const avatar = moment.author.avatarUrl || "/images/avatar-default.svg";
        return (
          <article key={moment.id} className="glass rounded-2xl p-5">
            {/* 作者行:头像/昵称 + 加好友 */}
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/u/${moment.author.username}`}
                className="flex items-center gap-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
                <span className="text-sm font-semibold">
                  {moment.author.nickname ?? moment.author.username}
                </span>
              </Link>
              <FriendButton
                targetUsername={moment.author.username}
                initialStatus={isSelf ? "self" : relation}
                loggedIn={!!sessionUsername}
              />
            </div>

            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7">
              {moment.content}
            </p>

            {moment.images.length > 0 && (
              <MomentImages
                images={moment.images.map((image) => ({ id: image.id, url: image.url }))}
              />
            )}

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
        );
      })}
    </div>
  );
}
