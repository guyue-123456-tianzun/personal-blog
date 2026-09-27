import { listPublicImages } from "@/lib/content-api";

// 照片墙(C6):全部公开图片,点击看原图
export const dynamic = "force-dynamic";

export const metadata = { title: "照片墙" };

export default async function PhotosPage() {
  const images = await listPublicImages();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">照片墙</h1>
      <p className="mt-2 text-sm opacity-60">共 {images.length} 张,点击查看原图。</p>

      {images.length === 0 ? (
        <p className="glass mt-8 rounded-2xl p-8 text-center text-sm opacity-60">
          还没有公开的图片。发带图的说说、或在外观后台上传背景图后会出现在这里。
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <a
              key={image.id}
              href={`/api/kb/attachments/${image.id}`}
              target="_blank"
              className="group relative overflow-hidden rounded-xl"
              title={image.filename}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/kb/attachments/${image.id}`}
                alt={image.filename}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {image.createdAt.slice(0, 10)}
              </span>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
