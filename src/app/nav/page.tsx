import PublicShell from "@/components/public/PublicShell";
import { listNavLinks } from "@/lib/collections";
import { getAdminUser } from "@/lib/users";

// 个人导航页(C4):站长的常用链接
export const dynamic = "force-dynamic";

export const metadata = { title: "导航" };

export default async function NavPage() {
  const admin = await getAdminUser();
  const links = admin ? await listNavLinks(admin) : [];
  const groups = [...new Set(links.map((link) => link.category))];

  return (
    <PublicShell>
      <div className="glass rounded-2xl p-6">
        <h1 className="text-xl font-bold">导航</h1>
        <p className="mt-1 text-sm opacity-60">常用的网站,一页直达。</p>
        {links.length === 0 ? (
          <p className="mt-6 text-sm opacity-60">还没有添加链接。</p>
        ) : (
          <div className="mt-5 space-y-5">
            {groups.map((group) => (
              <section key={group}>
                <h2 className="text-sm font-semibold opacity-70">{group}</h2>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {links
                    .filter((link) => link.category === group)
                    .map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        className="rounded-xl border border-border p-3 text-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {link.name}
                      </a>
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
