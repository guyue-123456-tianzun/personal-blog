"use client";

import { useState } from "react";

import Lightbox from "@/components/public/Lightbox";

export type PhotoItem = {
  id: number;
  filename: string;
  createdAt: string;
};

type Props = { images: PhotoItem[] };

// 照片墙网格:点击在当前页弹出灯箱看大图(以前是 target=_blank 开新标签页,
// 看完还得手动关掉那个标签才能回来,很打断)
export default function PhotoGrid({ images }: Props) {
  const [index, setIndex] = useState<number | null>(null);

  const lightboxImages = images.map((image) => ({
    src: `/api/kb/attachments/${image.id}`,
    caption: `${image.filename} · ${image.createdAt.slice(0, 10)}`,
  }));

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, i) => (
          <button
            key={image.id}
            onClick={() => setIndex(i)}
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
          </button>
        ))}
      </div>

      <Lightbox
        images={lightboxImages}
        index={index}
        onClose={() => setIndex(null)}
        onNavigate={setIndex}
      />
    </>
  );
}
