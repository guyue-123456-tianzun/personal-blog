"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// 好友申请按钮:根据当前关系渲染不同状态;点击发送申请
export default function FriendButton({
  targetUsername,
  initialStatus,
  loggedIn,
}: {
  targetUsername: string;
  initialStatus: "none" | "pending_out" | "pending_in" | "friends" | "self";
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!loggedIn) {
    return (
      <Link
        href="/?login=1&next=/moments"
        className="rounded-full border border-border px-3 py-1 text-xs transition-colors hover:bg-foreground/10"
      >
        登录后加好友
      </Link>
    );
  }

  if (status === "self") return null;
  if (status === "friends") {
    return (
      <span className="rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">
        已是好友 ✓
      </span>
    );
  }
  if (status === "pending_out") {
    return (
      <span className="rounded-full border border-border px-3 py-1 text-xs opacity-60">
        已发送申请
      </span>
    );
  }

  async function send() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", targetUsername }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "发送失败");
        return;
      }
      setStatus((data.status as typeof status) ?? "pending_out");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        onClick={send}
        disabled={busy}
        className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "pending_in" ? "同意对方的申请" : "+ 加好友"}
      </button>
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </span>
  );
}
