"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 好友操作按钮组:处理收到的申请(同意/拒绝)、撤回发出的申请、删除好友
export default function FriendActions({
  friendshipId,
  target,
  mode,
}: {
  friendshipId: number;
  target: string;
  mode: "incoming" | "outgoing" | "friend";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(action: "accept" | "reject" | "remove") {
    if (action === "remove" && mode === "friend") {
      if (!window.confirm(`确定删除好友「${target}」?`)) return;
    }
    setBusy(true);
    try {
      await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, requestId: friendshipId }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

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

  return (
    <button
      onClick={() => act("remove")}
      disabled={busy}
      className="shrink-0 text-sm text-red-500 hover:underline disabled:opacity-50"
    >
      {mode === "outgoing" ? "撤回申请" : "删除好友"}
    </button>
  );
}
