"use client";

import { useEffect, useRef, useState } from "react";

import { directAudioSongs, type Song } from "@/lib/music";

type Props = { playlist: Song[] };

// 导航栏迷你播放器(参考站同款):碟片 + 曲名 + 播放/下一首,中屏以上显示。
// 只播直接音频;网易云嵌入型歌曲只在首页音乐卡里出现。歌单来自"点歌台"。
export default function NavMusic({ playlist }: Props) {
  const audioSongs = directAudioSongs(playlist);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setIndex((i) => (i + 1) % audioSongs.length);
    audio.addEventListener("ended", onEnd);
    return () => audio.removeEventListener("ended", onEnd);
  }, [audioSongs.length]);

  if (audioSongs.length === 0) return null;

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
  }

  function next() {
    setIndex((i) => (i + 1) % audioSongs.length);
    setPlaying(true);
  }

  return (
    <div className="hidden items-center gap-1 rounded-full border border-border px-2 py-1 text-xs lg:flex">
      <span
        className={`text-sm ${playing ? "animate-spin [animation-duration:5s]" : ""}`}
        aria-hidden
      >
        💿
      </span>
      <span className="max-w-28 truncate opacity-80" title={audioSongs[index].title}>
        {audioSongs[index].title}
      </span>
      <button
        onClick={toggle}
        aria-label={playing ? "暂停音乐" : "播放音乐"}
        className="transition-opacity hover:opacity-70"
      >
        {playing ? "⏸" : "▶"}
      </button>
      <button onClick={next} aria-label="下一首" className="transition-opacity hover:opacity-70">
        ⏭
      </button>
      <audio ref={audioRef} src={audioSongs[index].url} />
    </div>
  );
}
