"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// 版本历史页的"回滚到此版":当前内容会先自动存档,所以回滚可以再滚回来
export default function RollbackButton({
  noteId,
  versionId,
}: {
  noteId: number;
  versionId: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function rollback() {
    if (!window.confirm("回滚到这个版本?当前内容会先自动存档,随时可以再滚回来。")) return;
    setBusy(true);
    const res = await fetch(`/api/kb/notes/${noteId}/rollback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    setBusy(false);
    if (res.ok) {
      router.push(`/kb/notes/${noteId}`);
      router.refresh();
    } else {
      window.alert("回滚失败,请重试");
    }
  }

  return (
    <button onClick={rollback} disabled={busy} className="text-sm text-accent hover:underline disabled:opacity-50">
      {busy ? "回滚中…" : "回滚到此版"}
    </button>
  );
}
