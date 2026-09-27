import NavLinksManager from "@/components/kb/NavLinksManager";
import { listNavLinks } from "@/lib/collections";
import { getSessionUser } from "@/lib/session";

// 导航页链接管理(C4)
export const dynamic = "force-dynamic";

export const metadata = { title: "导航页管理" };

export default async function KbNavLinksPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const links = await listNavLinks(sessionUser);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">导航页管理</h1>
      <p className="mt-1 text-sm opacity-60">公开页在 /nav,添加后自动出现。</p>
      <div className="mt-6">
        <NavLinksManager initial={links} />
      </div>
    </main>
  );
}
