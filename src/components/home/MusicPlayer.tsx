"use client";

import { useEffect, useRef, useState } from "react";

import {
  directAudioSongs,
  neteasePlaylistEmbedUrl,
  neteaseSongEmbedUrl,
  neteaseSongs,
  type Song,
} from "@/lib/music";

type Props = { playlist: Song[]; neteasePlaylistId: string | null };

// 音乐播放器小部件:支持两类歌曲——
// 1. 直接可播的音频(mp3/wav,上传或外链):旋转碟片 + 进度条 + 时间
// 2. 网易云歌曲(点歌台粘贴链接):内嵌官方外链播放器
export default function MusicPlayer({ playlist, neteasePlaylistId }: Props) {
  const audioSongs = directAudioSongs(playlist);
  const embeds = neteaseSongs(playlist);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [embedIndex, setEmbedIndex] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration > 0) setDuration(audio.duration);
    };
    const onEnd = () => {
      setIndex((i) => (i + 1) % audioSongs.length);
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
  }, [audioSongs.length]);

  if (audioSongs.length === 0 && embeds.length === 0) {
    return (
      <section className="glass flex h-full flex-col justify-center rounded-2xl p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <span className="inline-block h-4 w-1 rounded-full bg-accent-2" />
          音乐
        </h3>
        <p className="text-sm opacity-60">🎵 歌单还是空的。</p>
        <p className="mt-2 text-xs opacity-50">
          去「外观 → 点歌台」上传 mp3,或粘贴网易云歌曲链接。
        </p>
      </section>
    );
  }

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
    setIndex((i) => (i + delta + audioSongs.length) % audioSongs.length);
    setCurrentTime(0);
    setPlaying(true);
  }

  function fmt(seconds: number) {
    if (!Number.isFinite(seconds)) return "0:00";
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  }

  const current = audioSongs[index];

  return (
    <section className="glass flex h-full flex-col rounded-2xl p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="inline-block h-4 w-1 rounded-full bg-accent-2" />
        音乐
      </h3>

      {audioSongs.length > 0 && current && (
        <>
          <div className="flex items-center gap-3">
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

          <div className="mt-4 flex items-center justify-center gap-5 text-xl">
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

          <audio ref={audioRef} src={current.url} />
        </>
      )}

      {neteasePlaylistId && (
        <div className={audioSongs.length > 0 ? "mt-4 border-t border-border pt-3" : ""}>
          <p className="mb-1.5 text-xs opacity-60">
            🎧 网易云歌单(由官方外链播放器提供,含歌词)
          </p>
          <iframe
            src={`https://music.163.com/outchain/player?type=0&id=${neteasePlaylistId}&auto=0&height=330`}
            frameBorder="no"
            marginWidth={0}
            marginHeight={0}
            width="100%"
            height="330"
            className="rounded-lg"
          />
        </div>
      )}

      {embeds.length > 0 && (
        <div className={audioSongs.length > 0 ? "mt-4 border-t border-border pt-3" : ""}>
          <p className="mb-1.5 text-xs opacity-60">
            🎧 网易云单曲({embeds.length} 首)
          </p>
          <iframe
            key={embeds[embedIndex % embeds.length].url}
            src={neteaseSongEmbedUrl(
              embeds[embedIndex % embeds.length].url.replace("netease:", ""),
            )}
            frameBorder="no"
            marginWidth={0}
            marginHeight={0}
            width="100%"
            height="86"
            className="rounded-lg"
          />
          {embeds.length > 1 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {embeds.map((song, i) => (
                <button
                  key={song.url}
                  onClick={() => setEmbedIndex(i)}
                  className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                    i === embedIndex % embeds.length
                      ? "bg-accent text-white"
                      : "border border-border hover:bg-foreground/10"
                  }`}
                >
                  {song.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
