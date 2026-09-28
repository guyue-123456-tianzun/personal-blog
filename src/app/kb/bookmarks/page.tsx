import BookmarkManager from "@/components/kb/BookmarkManager";
import { listBookmarks } from "@/lib/collections";
import { getSessionUser } from "@/lib/session";

// 书签(C2):轻量链接收藏
export const dynamic = "force-dynamic";

export const metadata = { title: "书签" };

export default async function KbBookmarksPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const items = await listBookmarks(sessionUser);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">书签</h1>
      <p className="mt-1 text-sm opacity-60">
        想留着以后看的网址,记标题和链接就行。
      </p>
      <div className="mt-6">
        <BookmarkManager initial={items} />
      </div>
    </main>
  );
}
