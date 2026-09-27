"use client";

import { useEffect, useRef, useState } from "react";

import {
  directAudioSongs,
  neteasePlaylistEmbedUrl,
  type Song,
} from "@/lib/music";

type Props = {
  playlist: Song[];
  neteasePlaylistId: string | null;
};

// 导航栏音乐播放器(参考站同款):
// - 绑定了网易云歌单 → 点击弹出完整歌单播放器(官方外链,含歌词)
// - 未绑定但有本地歌曲 → 播放本地歌曲
// - 都没有 → 不显示
export default function NavMusic({ playlist, neteasePlaylistId }: Props) {
  const audioSongs = directAudioSongs(playlist);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setIndex((i) => (i + 1) % audioSongs.length);
    audio.addEventListener("ended", onEnd);
    return () => audio.removeEventListener("ended", onEnd);
  }, [audioSongs.length]);

  // 点击面板外部关闭
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!neteasePlaylistId && audioSongs.length === 0) return null;

  // ===== 网易云歌单模式 =====
  if (neteasePlaylistId) {
    return (
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="音乐播放器"
          title="音乐播放器"
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-foreground/10"
        >
          🎵
        </button>
        {open && (
          <div className="glass absolute right-0 top-full z-50 mt-2 w-[380px] rounded-2xl p-3 shadow-2xl">
            <iframe
              src={`https://music.163.com/outchain/player?type=0&id=${neteasePlaylistId}&auto=0&height=430`}
              frameBorder="no"
              marginWidth={0}
              marginHeight={0}
              width="100%"
              height="450"
              className="rounded-lg"
            />
          </div>
        )}
      </div>
    );
  }

  // ===== 本地歌曲模式 =====
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
