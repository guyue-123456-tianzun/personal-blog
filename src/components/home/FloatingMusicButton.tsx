"use client";

import { useEffect, useRef, useState } from "react";

import type { Song } from "@/lib/settings";

type Props = { playlist: Song[] };

// 浮动音乐圆盘:固定在左下角,播放时旋转,悬停显示歌名。
// 歌单来自外观设置的"点歌台"(props 传入),与导航/首页播放器各自独立播放。
export default function FloatingMusicButton({ playlist }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setIndex((i) => (i + 1) % playlist.length);
    audio.addEventListener("ended", onEnd);
    return () => audio.removeEventListener("ended", onEnd);
  }, [playlist.length]);

  if (playlist.length === 0) return null;

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }

  return (
    <div className="fixed bottom-5 left-5 z-40 flex items-center gap-2">
      <button
        onClick={toggle}
        aria-label={playing ? "暂停音乐" : "播放音乐"}
        className="group relative h-12 w-12 rounded-full shadow-lg ring-2 ring-white/30"
        title={playlist[index].title}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/avatar-default.svg"
          alt=""
          className={`h-full w-full rounded-full object-cover ${playing ? "animate-spin [animation-duration:6s]" : ""}`}
        />
        <span className="absolute inset-0 m-auto flex h-4 w-4 items-center justify-center rounded-full bg-background/90 text-[9px]">
          {playing ? "⏸" : "▶"}
        </span>
      </button>
      <span
        className={`glass rounded-full px-3 py-1 text-xs opacity-0 transition-opacity group-hover:opacity-0 ${playing ? "opacity-80" : ""}`}
      >
        {playlist[index].title}
      </span>
      <audio ref={audioRef} src={playlist[index].url} />
    </div>
  );
}
