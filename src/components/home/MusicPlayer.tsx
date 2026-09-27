"use client";

import { useEffect, useRef, useState } from "react";

import { siteConfig } from "@/lib/site-config";

// 音乐播放器小部件:旋转碟片 + 进度条 + 时间,歌单在 src/lib/site-config.ts 配置。
export default function MusicPlayer() {
  const playlist = siteConfig.music;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration > 0) setDuration(audio.duration);
    };
    const onEnd = () => {
      setIndex((i) => (i + 1) % playlist.length);
      setPlaying(true);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, [playlist.length]);

  if (playlist.length === 0) {
    return (
      <section className="glass flex h-full flex-col justify-center rounded-2xl p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <span className="inline-block h-4 w-1 rounded-full bg-accent-2" />
          音乐
        </h3>
        <p className="text-sm opacity-60">🎵 歌单还是空的。</p>
        <p className="mt-2 text-xs opacity-50">
          把 mp3 放进 public\music\ 目录,再到 src\lib\site-config.ts 里登记就绪。
        </p>
      </section>
    );
  }

  const current = playlist[index];

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }

  function switchTo(delta: number) {
    setIndex((i) => (i + delta + playlist.length) % playlist.length);
    setCurrentTime(0);
    setPlaying(true);
  }

  function fmt(seconds: number) {
    if (!Number.isFinite(seconds)) return "0:00";
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  }

  return (
    <section className="glass flex h-full flex-col rounded-2xl p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="inline-block h-4 w-1 rounded-full bg-accent-2" />
        音乐
      </h3>

      <div className="flex items-center gap-3">
        {/* 旋转碟片:播放时转起来 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/avatar-default.svg"
          alt=""
          className={`h-14 w-14 shrink-0 rounded-full border border-border object-cover ${
            playing ? "animate-spin [animation-duration:8s]" : ""
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{current.title}</p>
          <p className="mt-0.5 truncate text-xs opacity-60">{current.artist}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] opacity-50">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-center gap-5 pt-4 text-xl">
        <button onClick={() => switchTo(-1)} aria-label="上一首" className="transition-opacity hover:opacity-70">
          ⏮
        </button>
        <button
          onClick={togglePlay}
          aria-label={playing ? "暂停" : "播放"}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105"
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button onClick={() => switchTo(1)} aria-label="下一首" className="transition-opacity hover:opacity-70">
          ⏭
        </button>
      </div>

      <audio ref={audioRef} src={current.url} autoPlay={playing} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
    </section>
  );
}
