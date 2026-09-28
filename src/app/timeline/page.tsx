import { desc, eq } from "drizzle-orm";

import PublicShell from "@/components/public/PublicShell";
import { db } from "@/lib/db";
import { timelineEvents } from "@/db/schema";
import { getAdminUser } from "@/lib/users";

// 成长时间线(B8):展示站长的大事记
export const dynamic = "force-dynamic";

export const metadata = { title: "时间线" };

export default async function TimelinePage() {
  const admin = await getAdminUser();
  const events = admin
    ? await db
        .select()
        .from(timelineEvents)
        .where(eq(timelineEvents.userId, admin.id))
        .orderBy(desc(timelineEvents.date))
    : [];

  // 按年分组
  const byYear = new Map<string, typeof events>();
  for (const event of events) {
    const year = event.date.slice(0, 4);
    const list = byYear.get(year) ?? [];
    list.push(event);
    byYear.set(year, list);
  }

  return (
    <PublicShell>
      <div className="glass rounded-2xl p-6">
        <h1 className="text-xl font-bold">成长时间线</h1>
        <p className="mt-1 text-sm opacity-60">记录重要节点。</p>
        {events.length === 0 ? (
          <p className="mt-6 text-sm opacity-60">还没有记录。</p>
        ) : (
          <div className="mt-5 space-y-8">
            {[...byYear.entries()]
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([year, list]) => (
                <section key={year}>
                  <h2 className="text-lg font-bold">{year}</h2>
                  <div className="relative ml-2 mt-3 space-y-5 border-l-2 border-border pl-6">
                    {list.map((event) => (
                      <div key={event.id} className="relative">
                        <span className="absolute -left-[1.9rem] top-1 h-3 w-3 rounded-full border-2 border-[var(--background)] bg-accent" />
                        <p className="text-xs opacity-50">{event.date}</p>
                        <p className="mt-0.5 font-semibold">{event.title}</p>
                        {event.content && (
                          <p className="mt-1 text-sm opacity-70">{event.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
