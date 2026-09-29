"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type BuddyItem = {
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

// 申请列表的每条 = FriendInfo 结构(user 是对方:收到的申请里是申请人,发出的申请里是等待同意的人)
export type RequestItem = {
  id: number;
  user: { username: string; nickname: string | null; avatarUrl: string | null };
  createdAt: string;
};

type Props = {
  buddies: BuddyItem[];
  incoming: RequestItem[];
  outgoing: RequestItem[];
};

// 关系类型循环升级:普通好友 → 铁哥们 → 恋爱 → 回到普通好友
const TYPE_CYCLE = ["friend", "best", "love"] as const;
const TYPE_LABEL: Record<string, string> = {
  friend: "好友",
  best: "铁哥们",
  love: "恋爱",
};
const TYPE_STYLE: Record<string, string> = {
  friend: "border-sky-400/40 bg-sky-400/15 text-sky-300",
  best: "border-violet-400/40 bg-violet-400/15 text-violet-300",
  love: "border-pink-400/40 bg-pink-400/15 text-pink-300",
};

const inputClass =
  "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

// 下一档关系:库里存的 type 是 string,先收窄进三档循环再取下一个
function nextType(current: string): (typeof TYPE_CYCLE)[number] {
  const idx = TYPE_CYCLE.indexOf(current as (typeof TYPE_CYCLE)[number]);
  return TYPE_CYCLE[(idx + 1) % TYPE_CYCLE.length];
}

// 好友独立前台页(2026-09-29 站长拍板:好友功能从知识库后台里拿出来单独做):
// 好友卡片网格 + 收到/发出的申请 + 发起申请,全部操作登录用户自己的关系。
// 关系升级/降级 = 循环切换 friend → best → love;数据只有双方可见。
export default function BuddiesClient({ buddies, incoming, outgoing }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(body: Record<string, unknown>, ok: string) {
    if (busy) return;
    setBusy(true);
    setHint("");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setHint(data.error ?? "操作失败");
        return;
      }
      setHint(ok);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {hint && (
        <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm">
          {hint}
        </p>
      )}

      {/* ===== 发起申请 ===== */}
      <section className="glass rounded-2xl p-5">
        <h2 className="flex items-center gap-2.5 font-bold">
          <span className="inline-block h-4 w-1 rounded-full bg-accent" />
          加好友
        </h2>
        <p className="mt-1 text-sm opacity-60">
          输入对方的用户名发申请;对方同意后就是好友,关系还能升级成铁哥们或恋爱。
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="对方的用户名"
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={() => {
              if (!username.trim()) {
                setHint("先填用户名");
                return;
              }
              void call({ action: "send", targetUsername: username.trim() }, "申请已发出 ✓");
              setUsername("");
            }}
            disabled={busy}
            className="rounded-full bg-accent px-5 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            发申请
          </button>
        </div>
      </section>

      {/* ===== 收到的申请 ===== */}
      {incoming.length > 0 && (
        <section className="glass rounded-2xl p-5">
          <h2 className="flex items-center gap-2.5 font-bold">
            <span className="inline-block h-4 w-1 rounded-full bg-accent" />
            收到的申请
          </h2>
          <div className="mt-3 space-y-2">
            {incoming.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="text-sm">
                  <span className="font-medium">
                    {req.user.nickname ?? req.user.username}
                  </span>
                  <span className="ml-2 opacity-50">@{req.user.username}</span>
                  <span className="ml-3 text-xs opacity-45">{req.createdAt.slice(0, 10)}</span>
                </span>
                <span className="flex gap-2">
                  <button
                    onClick={() => call({ action: "accept", requestId: req.id }, "已是好友 ✓")}
                    disabled={busy}
                    className="rounded-full bg-accent px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90"
                  >
                    同意
                  </button>
                  <button
                    onClick={() => call({ action: "reject", requestId: req.id }, "已拒绝")}
                    disabled={busy}
                    className="rounded-full border border-border px-4 py-1.5 text-xs transition-colors hover:bg-foreground/10"
                  >
                    拒绝
                  </button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== 发出的申请 ===== */}
      {outgoing.length > 0 && (
        <section className="glass rounded-2xl p-5">
          <h2 className="flex items-center gap-2.5 font-bold">
            <span className="inline-block h-4 w-1 rounded-full bg-accent" />
            发出的申请
          </h2>
          <div className="mt-3 space-y-2">
            {outgoing.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="text-sm">
                  <span className="font-medium">
                    {req.user.nickname ?? req.user.username}
                  </span>
                  <span className="ml-2 opacity-50">@{req.user.username}</span>
                  <span className="ml-3 rounded-full border border-border px-2 py-0.5 text-xs opacity-60">
                    等待对方同意
                  </span>
                </span>
                <button
                  onClick={() => call({ action: "remove", requestId: req.id }, "已撤回")}
                  disabled={busy}
                  className="rounded-full border border-border px-4 py-1.5 text-xs transition-colors hover:bg-foreground/10"
                >
                  撤回
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== 我的好友 ===== */}
      <section className="glass rounded-2xl p-5">
        <h2 className="flex items-center gap-2.5 font-bold">
          <span className="inline-block h-4 w-1 rounded-full bg-accent" />
          我的好友 {buddies.length > 0 && <span className="text-sm opacity-50">{buddies.length} 位</span>}
        </h2>
        {buddies.length === 0 ? (
          <p className="mt-3 text-sm opacity-55">
            还没有好友,上面输入用户名发个申请吧。
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {buddies.map((buddy) => (
              <div
                key={buddy.friendshipId}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      buddy.user.avatarUrl ||
                      "/images/avatar-default.svg"
                    }
                    alt=""
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {buddy.user.nickname ?? buddy.user.username}
                    </p>
                    <p className="truncate text-xs opacity-50">
                      @{buddy.user.username}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs ${TYPE_STYLE[buddy.type] ?? TYPE_STYLE.friend}`}
                  >
                    {TYPE_LABEL[buddy.type] ?? "好友"}
                  </span>
                </div>
                {buddy.user.bio && (
                  <p className="mt-2 line-clamp-2 text-xs opacity-60">{buddy.user.bio}</p>
                )}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() =>
                      call(
                        {
                          action: "set-type",
                          requestId: buddy.friendshipId,
                          type: nextType(buddy.type),
                        },
                        `关系已升级为${TYPE_LABEL[nextType(buddy.type)]} ✓`,
                      )
                    }
                    disabled={busy}
                    className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-foreground/10"
                  >
                    升级关系 →
                  </button>
                  <button
                    onClick={() => {
                      if (!window.confirm(`确定删除好友 ${buddy.user.nickname ?? buddy.user.username} 吗?`)) {
                        return;
                      }
                      void call(
                        { action: "remove", requestId: buddy.friendshipId },
                        "已删除好友",
                      );
                    }}
                    disabled={busy}
                    className="rounded-full px-3 py-1 text-xs text-red-400/80 transition-colors hover:bg-red-400/10 hover:text-red-400"
                  >
                    删除好友
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
