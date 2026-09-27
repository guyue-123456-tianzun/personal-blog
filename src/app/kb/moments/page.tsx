import Link from "next/link";

import MomentComposer from "@/components/kb/MomentComposer";
import TrashActions from "@/components/kb/TrashActions";
import { listByNote } from "@/lib/attachments";
import { listKbNotes } from "@/lib/kb-content";

// 说说管理:发布 + 全部说说(含私密),可删除
export const dynamic = "force-dynamic";

export const metadata = { title: "说说管理" };

export default async function KbMomentsPage() {
  const moments = await listKbNotes("moment");
  const withImages = await Promise.all(
    moments.map(async (moment) => ({
      ...moment,
      images: (await listByNote(moment.id)).filter((file) =>
        file.mime.startsWith("image/"),
      ),
    })),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">说说</h1>
      <p className="mt-1 text-sm opacity-60">
        勾选「公开」会发布到网站的说说流;不勾选只有你能看到。
      </p>

      <div className="mt-6">
        <MomentComposer />
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold">
        全部说说({withImages.length})
      </h2>
      {withImages.length === 0 ? (
        <p className="opacity-60">还没有说说。</p>
      ) : (
        <div className="space-y-3">
          {withImages.map((moment) => (
            <div key={moment.id} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3 text-xs opacity-60">
                <span>
                  {moment.isPublic === 1 ? "🌐 公开" : "🔒 私密"} ·{" "}
                  {moment.updatedAt.slice(0, 16)}
                </span>
                <TrashActions id={moment.id} title={moment.title} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                {moment.content}
              </p>
              {moment.images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {moment.images.map((image) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={image.id}
                      src={`/api/kb/attachments/${image.id}`}
                      alt=""
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Link href="/moments" className="mt-8 inline-block text-sm text-accent hover:underline">
        → 查看前台说说流
      </Link>
    </main>
  );
}
