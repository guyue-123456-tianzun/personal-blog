"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 回收站里每一条的两个动作:还原 / 彻底删除
export default function TrashActions({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function restore() {
    setBusy(true);
    await fetch(`/api/kb/notes/${id}/restore`, { method: "POST" });
    router.refresh();
    setBusy(false);
  }

  async function purge() {
    if (!window.confirm(`「${title}」将被彻底删除,连历史版本一起清掉,不可还原。确定?`)) {
      return;
    }
    setBusy(true);
    await fetch(`/api/kb/notes/${id}/purge`, { method: "DELETE" });
    router.refresh();
    setBusy(false);
  }

  return (
    <span className="flex shrink-0 gap-3 text-sm">
      <button onClick={restore} disabled={busy} className="text-accent hover:underline disabled:opacity-50">
        还原
      </button>
      <button onClick={purge} disabled={busy} className="text-red-500 hover:underline disabled:opacity-50">
        彻底删除
      </button>
    </span>
  );
}
