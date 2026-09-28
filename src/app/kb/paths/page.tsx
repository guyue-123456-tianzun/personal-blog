import Link from "next/link";

import PathsManager from "@/components/kb/PathsManager";
import { listPaths } from "@/lib/collections";
import { getSessionUser } from "@/lib/session";

// 学习路线(B7):路线 → 节点 → 打卡进度
export const dynamic = "force-dynamic";

export const metadata = { title: "学习路线" };

export default async function KbPathsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const paths = await listPaths(sessionUser);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">学习路线</h1>
        <Link href="/paths" className="text-sm text-accent hover:underline">
          → 查看前台展示页
        </Link>
      </div>
      <p className="mt-1 text-sm opacity-60">
        把想学的东西拆成节点,完成一个勾一个。
      </p>
      <div className="mt-6">
        <PathsManager initial={paths} />
      </div>
    </main>
  );
}
