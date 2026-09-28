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
  /** 覆盖态(首页首屏大图上)图标用白字 */
  overlay: boolean;
};

// 导航栏点歌按钮(参考站同款):♪ 图标 → 弹出歌单面板。
// 绑定了网易云歌单 → 官方外链播放器(含歌词);否则回落本地歌曲播放。
export default function NavMusic({
  playlist,
  neteasePlaylistId,
  overlay,
}: Props) {
  const audioSongs = directAudioSongs(playlist);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setIndex((i) => (i + 1) % audioSongs.length);
    audio.addEventListener("ended", onEnd);
    return () => audio.removeEventListener("ended", onEnd);
  }, [audioSongs.length]);

  // 点面板外部收起
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

  const hoverCls = overlay ? "hover:bg-white/15" : "hover:bg-foreground/10";

  function toggleLocal() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
    setPlaying(!playing);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="音乐点歌"
        title="音乐点歌"
        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
          overlay ? "hover:bg-white/15" : hoverCls
        }`}
      >
        ♪
      </button>

      {open && (
        <div className="glass absolute right-0 top-full z-50 mt-3 w-[360px] rounded-2xl p-3 shadow-2xl">
          {neteasePlaylistId ? (
            <>
              <p className="mb-2 px-1 text-xs opacity-60">
                🎧 网易云歌单(官方外链播放器,含歌词)
              </p>
              <iframe
                src={neteasePlaylistEmbedUrl(neteasePlaylistId)}
                frameBorder="no"
                marginWidth={0}
                marginHeight={0}
                width="100%"
                height="450"
                className="rounded-lg"
              />
            </>
          ) : (
            <>
              <p className="mb-2 px-1 text-xs opacity-60">
                🎵 本地歌单({audioSongs.length} 首)
              </p>
              <div className="space-y-1.5">
                {audioSongs.map((song, i) => (
                  <div
                    key={song.url}
                    className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
                      i === index ? "bg-foreground/10" : ""
                    }`}
                  >
                    <span className="min-w-0 truncate">{song.title}</span>
                    <span className="shrink-0 text-xs opacity-50">{song.artist}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  onClick={() => setIndex((i) => (i - 1 + audioSongs.length) % audioSongs.length)}
                  aria-label="上一首"
                  className="transition-opacity hover:opacity-70"
                >
                  ⏮
                </button>
                <button
                  onClick={toggleLocal}
                  aria-label={playing ? "暂停" : "播放"}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-lg"
                >
                  {playing ? "⏸" : "▶"}
                </button>
                <button
                  onClick={() => setIndex((i) => (i + 1) % audioSongs.length)}
                  aria-label="下一首"
                  className="transition-opacity hover:opacity-70"
                >
                  ⏭
                </button>
              </div>
              <audio ref={audioRef} src={audioSongs[index].url} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
