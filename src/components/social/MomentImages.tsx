"use client";

import { useState } from "react";

import Lightbox from "@/components/public/Lightbox";

type ImageItem = { id: number; url: string };

type Props = { images: ImageItem[] };

// 说说配图:点击在当前页弹出灯箱看大图,不再开新标签页。
// 朋友圈 feed 和个人主页的动态列表共用。
export default function MomentImages({ images }: Props) {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <div
        className={`mt-3 grid gap-2 ${
          images.length === 1 ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        {images.map((image, i) => (
          <button
            key={image.id}
            onClick={() => setIndex(i)}
            className="overflow-hidden rounded-xl"
            aria-label="查看大图"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt=""
              className="h-44 w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </button>
        ))}
      </div>

      <Lightbox
        images={images.map((image) => ({ src: image.url }))}
        index={index}
        onClose={() => setIndex(null)}
        onNavigate={setIndex}
      />
    </>
  );
}
