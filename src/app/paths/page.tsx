import Link from "next/link";

import PublicShell from "@/components/public/PublicShell";
import { listPaths } from "@/lib/collections";
import { getAdminUser } from "@/lib/users";

// 学习路线(B7):展示站长的路线与进度
export const dynamic = "force-dynamic";

export const metadata = { title: "学习路线" };

export default async function PathsPage() {
  const admin = await getAdminUser();
  const paths = admin ? await listPaths(admin) : [];

  return (
    <PublicShell>
      <div className="glass rounded-2xl p-6">
        <h1 className="text-xl font-bold">学习路线</h1>
        <p className="mt-1 text-sm opacity-60">
          正在进行的成长计划,完成进度实时更新。
        </p>
        {paths.length === 0 ? (
          <p className="mt-6 text-sm opacity-60">还没有公开的路线。</p>
        ) : (
          <div className="mt-5 space-y-6">
            {paths.map((path) => {
              const done = path.nodes.filter((n) => n.done).length;
              const pct = path.nodes.length
                ? Math.round((done / path.nodes.length) * 100)
                : 0;
              return (
                <section key={path.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-bold">{path.title}</h2>
                    <span className="text-xs opacity-60">{pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {path.nodes.map((node) => (
                      <li key={node.id} className="flex items-center gap-2">
                        <span>{node.done ? "✅" : "⬜"}</span>
                        <span className={node.done ? "opacity-50 line-through" : ""}>
                          {node.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
        <p className="mt-6 text-xs opacity-40">
          想知道某条路线的细节?
          <Link href="/about" className="text-accent hover:underline">
            联系我
          </Link>
          。
        </p>
      </div>
    </PublicShell>
  );
}
