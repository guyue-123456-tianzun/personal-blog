import Link from "next/link";

import MomentComposer from "@/components/kb/MomentComposer";
import MomentsFeed from "@/components/social/MomentsFeed";
import { listPublicMoments } from "@/lib/content-api";
import { getRelationStatus } from "@/lib/friends";
import { getSessionUser } from "@/lib/session";

// 朋友圈(B4 + 社交层):登录用户可发动态;feed 汇集全站用户的公开动态,
// 支持随机刷新,可向作者发好友申请。访客只能围观。
export const dynamic = "force-dynamic";

export const metadata = { title: "朋友圈" };

const PAGE_SIZE = 10;

type Props = { searchParams: Promise<{ page?: string }> };

export default async function MomentsPage({ searchParams }: Props) {
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const sessionUser = await getSessionUser();

  const moments = await listPublicMoments(
    PAGE_SIZE,
    (pageNum - 1) * PAGE_SIZE,
  );

  // 与 feed 里出现的作者计算关系(加好友按钮渲染用)
  const relations: Record<
    string,
    { status: "none" | "pending_out" | "pending_in" | "friends" | "self"; requestId: number | null }
  > = {};
  if (sessionUser) {
    for (const moment of moments) {
      const username = moment.author.username;
      if (username === sessionUser.username || relations[username]) continue;
      relations[username] = await getRelationStatus(
        sessionUser.id,
        moment.author.id,
      );
    }
  }

  const hasMore = moments.length === PAGE_SIZE;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">朋友圈</h1>
        <Link href="/" className="text-sm text-accent hover:underline">
          ← 返回首页
        </Link>
      </div>
      <p className="mt-2 text-sm opacity-60">
        全站用户的公开动态。随机刷新,遇见同好,还可以交个朋友。
      </p>

      {sessionUser ? (
        <div className="mt-6">
          <MomentComposer />
        </div>
      ) : (
        <div className="glass mt-6 rounded-2xl p-5 text-center text-sm">
          <p className="opacity-70">
            <Link href="/?login=1&next=/moments" className="text-accent hover:underline">
              登录或注册
            </Link>{" "}
            后也可以发自己的动态、结识朋友。
          </p>
        </div>
      )}

      {moments.length === 0 ? (
        <p className="glass mt-6 rounded-2xl p-8 text-center text-sm opacity-60">
          还没有公开动态,来发第一条吧。
        </p>
      ) : (
        <div className="mt-6">
          <MomentsFeed
            moments={moments}
            sessionUsername={sessionUser?.username ?? null}
            relations={relations}
          />
        </div>
      )}

      <div className="mt-6 flex justify-center gap-4 text-sm">
        {pageNum > 1 && (
          <Link href={`/moments?page=${pageNum - 1}`} className="text-accent hover:underline">
            ← 上一页
          </Link>
        )}
        {hasMore && (
          <Link href={`/moments?page=${pageNum + 1}`} className="text-accent hover:underline">
            下一页 →
          </Link>
        )}
      </div>
    </main>
  );
}
