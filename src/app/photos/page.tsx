import { listPublicImages } from "@/lib/content-api";
import { getSessionUser } from "@/lib/session";
import PhotoGrid from "@/components/public/PhotoGrid";
import PhotoUpload from "@/components/public/PhotoUpload";
import PublicShell from "@/components/public/PublicShell";

// 照片墙(C6):全部公开图片,点击看原图
export const dynamic = "force-dynamic";

export const metadata = { title: "照片墙" };

export default async function PhotosPage() {
  const [images, viewer] = await Promise.all([listPublicImages(), getSessionUser()]);

  return (
    <PublicShell>
      <h1 className="text-2xl font-bold">照片墙</h1>
      <p className="mt-2 text-sm opacity-60">共 {images.length} 张,点击查看原图。</p>

      {viewer?.role === "admin" && <PhotoUpload />}

      {images.length === 0 ? (
        <p className="glass mt-8 rounded-2xl p-8 text-center text-sm opacity-60">
          还没有公开的图片。发带图的说说、或在外观后台上传背景图后会出现在这里。
        </p>
      ) : (
        <PhotoGrid images={images} />
      )}
    </PublicShell>
  );
}
