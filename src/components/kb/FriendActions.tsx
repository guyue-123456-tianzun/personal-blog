"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 好友操作按钮组:处理申请(同意/拒绝)、删除好友、关系升级(铁哥们/恋爱)
export default function FriendActions({
  friendshipId,
  target,
  mode,
  type = "friend",
}: {
  friendshipId: number;
  target: string;
  mode: "incoming" | "outgoing" | "friend";
  type?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "accept" | "reject" | "remove" | "set-type", friendType?: string) {
    if (action === "remove" && mode === "friend") {
      if (!window.confirm(`确定删除好友「${target}」?`)) return;
    }
    setBusy(true);
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          requestId: friendshipId,
          ...(friendType ? { type: friendType } : {}),
        }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const typeBadge =
    mode === "friend" ? (
      <span
        className={`rounded-full px-2 py-0.5 text-xs ${
          type === "love"
            ? "bg-pink-500/20 text-pink-500"
            : type === "best"
              ? "bg-amber-500/20 text-amber-500"
              : "bg-foreground/10 opacity-70"
        }`}
      >
        {type === "best" ? "⚡ 铁哥们" : type === "love" ? "❤ 恋爱" : "好友"}
      </span>
    ) : null;

  if (mode === "incoming") {
    return (
      <span className="flex shrink-0 gap-2 text-sm">
        <button
          onClick={() => act("accept")}
          disabled={busy}
          className="rounded-full bg-accent px-3 py-1 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          同意
        </button>
        <button
          onClick={() => act("reject")}
          disabled={busy}
          className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-foreground/10 disabled:opacity-50"
        >
          拒绝
        </button>
      </span>
    );
  }

  if (mode === "outgoing") {
    return (
      <button
        onClick={() => act("remove")}
        disabled={busy}
        className="shrink-0 text-sm text-red-500 hover:underline disabled:opacity-50"
      >
        撤回申请
      </button>
    );
  }

  // 已是好友:关系升级按钮
  return (
    <span className="flex shrink-0 flex-col items-end gap-1.5">
      {typeBadge}
      <span className="flex gap-1.5 text-xs">
        {type !== "best" && (
          <button
            onClick={() => act("set-type", "best")}
            disabled={busy}
            className="rounded-full border border-border px-2 py-0.5 transition-colors hover:bg-foreground/10 disabled:opacity-50"
          >
            ⚡ 升级铁哥们
          </button>
        )}
        {type !== "love" && (
          <button
            onClick={() => act("set-type", "love")}
            disabled={busy}
            className="rounded-full border border-border px-2 py-0.5 transition-colors hover:bg-foreground/10 disabled:opacity-50"
          >
            ❤ 成为恋爱关系
          </button>
        )}
        {type !== "friend" && (
          <button
            onClick={() => act("set-type", "friend")}
            disabled={busy}
            className="rounded-full border border-border px-2 py-0.5 transition-colors hover:bg-foreground/10 disabled:opacity-50"
          >
            恢复普通好友
          </button>
        )}
        <button
          onClick={() => act("remove")}
          disabled={busy}
          className="text-red-500 hover:underline disabled:opacity-50"
        >
          删除
        </button>
      </span>
    </span>
  );
}
