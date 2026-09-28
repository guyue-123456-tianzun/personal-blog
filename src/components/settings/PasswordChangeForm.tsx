"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import LogoutButton from "@/components/kb/LogoutButton";

const inputClass =
  "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-accent";

type Props = { username: string };

// 账号安全:改密码 + 退出登录。设置页里的"账号"区块。
export default function PasswordChangeForm({ username }: Props) {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hint, setHint] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (newPassword !== confirm) {
      setHint("两次输入的新密码不一致");
      return;
    }
    setBusy(true);
    setHint("");
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = (await res.json().catch(() => ({})) as { error?: string });
      if (!res.ok) {
        setHint(data.error ?? "修改失败");
        return;
      }
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
      setHint("密码已修改 ✓(当前登录保持有效)");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm opacity-60">
        当前账号 <span className="font-medium opacity-100">{username}</span>
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="grid gap-3 sm:grid-cols-3"
      >
        <input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="旧密码"
          autoComplete="current-password"
          className={inputClass}
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="新密码(至少 6 位)"
          autoComplete="new-password"
          className={inputClass}
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="再输一遍新密码"
          autoComplete="new-password"
          className={inputClass}
        />
        <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-accent px-5 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "保存中…" : "修改密码"}
          </button>
          <LogoutButton />
          {hint && <span className="text-xs opacity-70">{hint}</span>}
        </div>
      </form>
    </div>
  );
}
