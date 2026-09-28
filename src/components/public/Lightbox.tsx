"use client";

import { useCallback, useEffect } from "react";

export type LightboxImage = {
  src: string;
  caption?: string;
};

type Props = {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

// 全站通用的图片灯箱:点击站内图片在当前页放大观看,
// 不再开新标签页打断浏览。← → 切换,Esc/点空白关闭。
export default function Lightbox({ images, index, onClose, onNavigate }: Props) {
  const open = index !== null && index >= 0 && index < images.length;

  const prev = useCallback(() => {
    if (index === null) return;
    onNavigate((index - 1 + images.length) % images.length);
  }, [index, images.length, onNavigate]);

  const next = useCallback(() => {
    if (index === null) return;
    onNavigate((index + 1) % images.length);
  }, [index, images.length, onNavigate]);

  // 键盘操作 + 灯箱开着时锁住背景滚动
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = oldOverflow;
    };
  }, [open, onClose, prev, next]);

  if (!open || index === null) return null;
  const image = images[index];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="图片查看"
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        aria-label="关闭"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20"
      >
        ✕
      </button>

      {/* 左右切换(多于一张时) */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="上一张"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="下一张"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20"
          >
            ›
          </button>
        </>
      )}

      {/* 大图:点图片本身不关闭,点周围空白才关 */}
      <div
        className="flex max-h-[88vh] max-w-[92vw] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.src}
          alt={image.caption ?? ""}
          className="max-h-[80vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
        />
        <div className="mt-3 flex items-center gap-3 text-xs text-white/70">
          {image.caption && <span className="max-w-[60vw] truncate">{image.caption}</span>}
          {images.length > 1 && (
            <span className="shrink-0">
              {index + 1} / {images.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
