import Link from "next/link";

import MediaManager from "@/components/kb/MediaManager";
import { listMedia } from "@/lib/media";

// 书影音管理:添加/编辑/删除
export const dynamic = "force-dynamic";

export const metadata = { title: "书影音管理" };

export default async function KbMediaPage() {
  const items = await listMedia();

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">书影音</h1>
        <Link href="/media" className="text-sm text-accent hover:underline">
          → 查看前台书影音
        </Link>
      </div>
      <p className="mt-1 text-sm opacity-60">
        读过的书、看过的片、玩过的游,想读/在读/读完一目了然。
      </p>
      <div className="mt-6">
        <MediaManager initial={items} />
      </div>
    </main>
  );
}
