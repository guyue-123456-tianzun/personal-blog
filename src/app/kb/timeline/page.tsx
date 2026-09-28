import Link from "next/link";

import TimelineManager from "@/components/kb/TimelineManager";
import { listTimeline } from "@/lib/collections";
import { getSessionUser } from "@/lib/session";

// 成长时间线(B8):大事记
export const dynamic = "force-dynamic";

export const metadata = { title: "成长时间线" };

export default async function KbTimelinePage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const events = await listTimeline(sessionUser);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">成长时间线</h1>
        <Link href="/timeline" className="text-sm text-accent hover:underline">
          → 查看前台展示页
        </Link>
      </div>
      <p className="mt-1 text-sm opacity-60">记下重要节点,时间线会自动按年分组。</p>
      <div className="mt-6">
        <TimelineManager initial={events} />
      </div>
    </main>
  );
}
