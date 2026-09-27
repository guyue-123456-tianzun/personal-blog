"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { Appearance, Song } from "@/lib/settings";
import { parseNeteaseId, parseNeteasePlaylistId } from "@/lib/music";

type Props = { initial: Appearance };

// 内置预设:夜间用星夜插画,白天用阳光草地插画,封面渐变两边通用
const NIGHT_HERO = "/images/hero-default.svg";
const DAY_HERO = "/images/hero-day-default.svg";
const COVERS = [
  "/images/cover-1.svg",
  "/images/cover-2.svg",
  "/images/cover-3.svg",
  "/images/cover-4.svg",
];
const NIGHT_PRESETS = [NIGHT_HERO, ...COVERS];
const DAY_PRESETS = [DAY_HERO, ...COVERS];

// 通用图片槽位:预设一键选 + 上传 + 恢复默认(夜间/白天复用)
function ImageSlot({
  label,
  hint,
  value,
  presets,
  busy,
  onPick,
  onUpload,
  onReset,
  inputRef,
  accept = "image/png,image/jpeg,image/webp",
}: {
  label: string;
  hint?: string;
  value: string;
  presets: string[];
  busy: boolean;
  onPick: (preset: string) => void;
  onUpload: (file: File) => void;
  onReset: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  accept?: string;
}) {
  const isVideo = /\.(mp4|webm)$/i.test(value);
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <button
          onClick={onReset}
          disabled={busy}
          className="text-xs text-accent hover:underline disabled:opacity-50"
        >
          恢复默认
        </button>
      </div>
      {hint && <p className="mt-1 text-xs opacity-50">{hint}</p>}

      <div className="mt-2.5 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => onPick(preset)}
            disabled={busy}
            className={`overflow-hidden rounded-lg border-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 ${
              value === preset ? "border-accent" : "border-transparent"
            }`}
            title="点击选用"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preset} alt="" className="h-12 w-20 object-cover" />
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        {isVideo ? (
          <span className="flex h-12 w-20 items-center justify-center rounded-lg bg-foreground/10 text-xs">
            🎬 视频
          </span>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={value}
            alt=""
            className="h-12 w-20 rounded-lg object-cover"
          />
        )}
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-border px-4 py-2 text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          上传新图
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onUpload(file);
          }}
        />
      </div>
    </div>
  );
}

// 外观设置表单:夜间/白天双壁纸、头像、虚化、高度、签名、公告、点歌台
export default function AppearanceForm({ initial }: Props) {
  const router = useRouter();
  const [heroImage, setHeroImage] = useState(initial.heroImage);
  const [heroImageDay, setHeroImageDay] = useState(initial.heroImageDay);
  const [avatar, setAvatar] = useState(initial.avatar);
  const [blur, setBlur] = useState(initial.heroBlur);
  const [height, setHeight] = useState(initial.heroHeightVh);
  const [wallImage, setWallImage] = useState(initial.wallImage);
  const [wallImageDay, setWallImageDay] = useState(initial.wallImageDay);
  const [wallBlur, setWallBlur] = useState(initial.wallBlur);
  const [carouselEnabled, setCarouselEnabled] = useState(
    initial.wallCarouselEnabled,
  );
  const [carouselSeconds, setCarouselSeconds] = useState(
    initial.wallCarouselSeconds,
  );
  const [songs, setSongs] = useState<Song[]>(initial.music);
  const [songTitle, setSongTitle] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [neteaseInput, setNeteaseInput] = useState("");
  const [playlistInput, setPlaylistInput] = useState(initial.neteasePlaylistId ?? "");
  const [wallpapers, setWallpapers] = useState<{ name: string; url: string }[]>([]);
  const [signature, setSignature] = useState(initial.signature);
  const [announcements, setAnnouncements] = useState(
    initial.announcements.join("\n"),
  );
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const heroDayInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const wallInputRef = useRef<HTMLInputElement | null>(null);
  const wallDayInputRef = useRef<HTMLInputElement | null>(null);
  const songInputRef = useRef<HTMLInputElement | null>(null);

  // 通用批量保存:values 里的键走后端白名单校验,null 表示清除该项
  async function patchValues(values: Record<string, string | null>): Promise<boolean> {
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/kb/appearance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus(data.error ?? "保存失败");
        return false;
      }
      setStatus("已保存 ✓");
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(kind: string, file: File) {
    setBusy(true);
    setStatus("");
    try {
      const form = new FormData();
      form.append("file", file);
      if (kind.startsWith("wall") || kind === "hero_image_url_day") {
        form.append("public", "1"); // 背景图/头像必须访客可见
      }
      const res = await fetch("/api/kb/attachments", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        attachment?: { id: number };
      };
      if (!res.ok || !data.attachment) {
        setStatus(data.error ?? "上传失败");
        return;
      }
      const url = `/api/kb/attachments/${data.attachment.id}`;
      const ok = await patchValues({ [kind]: url });
      if (!ok) return;
      if (kind === "hero_image_url") setHeroImage(url);
      if (kind === "hero_image_url_day") setHeroImageDay(url);
      if (kind === "wall_image_url") setWallImage(url);
      if (kind === "wall_image_url_day") setWallImageDay(url);
      if (kind === "avatar_url") setAvatar(url);
    } finally {
      setBusy(false);
    }
  }

  async function resetOne(key: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/kb/appearance", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        appearance?: Appearance;
      };
      if (res.ok && data.appearance) {
        setHeroImage(data.appearance.heroImage);
        setHeroImageDay(data.appearance.heroImageDay);
        setAvatar(data.appearance.avatar);
        setBlur(data.appearance.heroBlur);
        setHeight(data.appearance.heroHeightVh);
        setWallImage(data.appearance.wallImage);
        setWallImageDay(data.appearance.wallImageDay);
        setWallBlur(data.appearance.wallBlur);
        setCarouselEnabled(data.appearance.wallCarouselEnabled);
        setCarouselSeconds(data.appearance.wallCarouselSeconds);
        setSignature(data.appearance.signature);
        setAnnouncements(data.appearance.announcements.join("\n"));
        setStatus("已恢复默认");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    await patchValues({
      hero_blur: String(blur),
      hero_height: String(height),
      wall_blur: String(wallBlur),
      wall_carousel_enabled: carouselEnabled ? "1" : "0",
      wall_carousel_seconds: String(carouselSeconds),
      signature,
      announcements: JSON.stringify(
        announcements.split("\n").map((line) => line.trim()).filter(Boolean),
      ),
    });
  }

  /** 点歌台:上传 mp3 到公开附件,自动登记进歌单 */
  async function uploadSong(file: File) {
    setBusy(true);
    setStatus("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("public", "1");
      const res = await fetch("/api/kb/attachments", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        attachment?: { id: number };
      };
      if (!res.ok || !data.attachment) {
        setStatus(data.error ?? "上传失败");
        return;
      }
      const next: Song[] = [
        ...songs,
        {
          title: file.name.replace(/\.[^.]+$/, ""),
          artist: "未知歌手",
          url: `/api/kb/attachments/${data.attachment.id}`,
        },
      ];
      setBusy(false);
      const ok = await patchValues({ music: JSON.stringify(next) });
      if (ok) setSongs(next);
    } finally {
      setBusy(false);
    }
  }

  async function addSongByUrl() {
    if (!songTitle.trim()) {
      setStatus("请填写歌名");
      return;
    }
    if (!/^https?:\/\/|^\//.test(songUrl.trim())) {
      setStatus("歌曲地址要以 http(s):// 或 / 开头");
      return;
    }
    const next: Song[] = [
      ...songs,
      { title: songTitle.trim(), artist: "未知歌手", url: songUrl.trim() },
    ];
    const ok = await patchValues({ music: JSON.stringify(next) });
    if (ok) {
      setSongs(next);
      setSongTitle("");
      setSongUrl("");
    }
  }

  async function addNetease() {
    const id = parseNeteaseId(neteaseInput);
    if (!id) {
      setStatus("没解析出网易云歌曲 ID,请粘贴 song 链接或纯数字");
      return;
    }
    const next: Song[] = [
      ...songs,
      { title: `网易云 ${id}`, artist: "网易云音乐", url: `netease:${id}` },
    ];
    const ok = await patchValues({ music: JSON.stringify(next) });
    if (ok) {
      setSongs(next);
      setNeteaseInput("");
    }
  }

  async function deleteSong(index: number) {
    const next = songs.filter((_, i) => i !== index);
    const ok = await patchValues({ music: JSON.stringify(next) });
    if (ok) setSongs(next);
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="space-y-6">
      {/* 实时预览:跟随当前主题(夜/日) */}
      <div>
        <h3 className="mb-2 font-semibold">预览(跟随下方深浅色模式)</h3>
        <div
          className="relative overflow-hidden rounded-2xl border border-border"
          style={{ height: Math.round((height / 100) * 320) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImageDay}
            alt=""
            className="h-full w-full object-cover dark:hidden"
            style={{ filter: `blur(${Math.round(blur * 0.5)}px)`, transform: "scale(1.08)" }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            className="hidden h-full w-full object-cover dark:block"
            style={{ filter: `blur(${Math.round(blur * 0.5)}px)`, transform: "scale(1.08)" }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <p className="text-xl font-bold drop-shadow">{signature || "签名"}</p>
          </div>
        </div>
      </div>

      {/* Hero 背景图:夜间/白天两个槽位 */}
      <div className="glass space-y-4 rounded-2xl p-5">
        <h3 className="font-semibold">Hero 背景图</h3>
        <ImageSlot
          label="🌙 夜间 Hero(深色模式显示)"
          value={heroImage}
          presets={NIGHT_PRESETS}
          busy={busy}
          onPick={(preset) => patchValues({ hero_image_url: preset })}
          onUpload={(file) => uploadImage("hero_image_url", file)}
          onReset={() => resetOne("hero_image_url")}
          inputRef={heroInputRef}
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
        />
        <ImageSlot
          label="☀️ 白天 Hero(浅色模式显示)"
          hint="想要阳光朝气的感觉,就选或传一张暖色调的图"
          value={heroImageDay}
          presets={DAY_PRESETS}
          busy={busy}
          onPick={(preset) => patchValues({ hero_image_url_day: preset })}
          onUpload={(file) => uploadImage("hero_image_url_day", file)}
          onReset={() => resetOne("hero_image_url_day")}
          inputRef={heroDayInputRef}
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
        />
        <p className="text-xs opacity-40">
          白天未单独设置时,会跟随夜间的自定义图;两者都支持 mp4 视频壁纸(上限 100MB)。
        </p>
      </div>

      {/* 头像 */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold">头像</h3>
        <div className="mt-3 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt="头像" className="h-14 w-14 rounded-full object-cover" />
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-border px-4 py-2 text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            上传新头像
          </button>
          <button
            onClick={() => resetOne("avatar_url")}
            disabled={busy}
            className="text-sm text-accent hover:underline disabled:opacity-50"
          >
            恢复默认
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) uploadImage("avatar_url", file);
            }}
          />
        </div>
      </div>

      {/* 页面壁纸(沉浸式背景):夜间/白天两个槽位 */}
      <div className="glass space-y-4 rounded-2xl p-5">
        <div>
          <h3 className="font-semibold">页面壁纸(沉浸式背景)</h3>
          <p className="mt-1 text-xs opacity-50">
            整站玻璃卡片都浮在这张虚化后的图上;下拉滚动时夜间/白天各用各的,过渡自然。
          </p>
        </div>

        <ImageSlot
          label="🌙 夜间壁纸"
          value={wallImage}
          presets={NIGHT_PRESETS}
          busy={busy}
          onPick={(preset) => patchValues({ wall_image_url: preset })}
          onUpload={(file) => uploadImage("wall_image_url", file)}
          onReset={() => resetOne("wall_image_url")}
          inputRef={wallInputRef}
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
        />

        <ImageSlot
          label="☀️ 白天壁纸"
          hint="阳光、暖色、清新的图;未设置时跟随夜间壁纸"
          value={wallImageDay}
          presets={DAY_PRESETS}
          busy={busy}
          onPick={(preset) => patchValues({ wall_image_url_day: preset })}
          onUpload={(file) => uploadImage("wall_image_url_day", file)}
          onReset={() => resetOne("wall_image_url_day")}
          inputRef={wallDayInputRef}
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
        />

        {/* 壁纸库:public/wallpapers/ 目录,支持 Wallpaper Engine 的 mp4 视频壁纸 */}
        {wallpapers.length > 0 && (
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">壁纸库(public\wallpapers\)</p>
            <p className="mt-1 text-xs opacity-50">
              把 Wallpaper Engine 的视频壁纸(mp4)或任何图片复制到
              项目\public\wallpapers\ 文件夹,即可在这里一键选用(🎬 = 视频)。
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {wallpapers.map((wall) => (
                <button
                  key={wall.url}
                  onClick={() =>
                    patchValues(
                      /\.(mp4|webm)$/i.test(wall.url)
                        ? { wall_image_url_day: wall.url, wall_image_url: wall.url }
                        : { wall_image_url_day: wall.url, wall_image_url: wall.url },
                    )
                  }
                  disabled={busy}
                  className={`overflow-hidden rounded-lg border-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 ${
                    wallImage === wall.url || wallImageDay === wall.url
                      ? "border-accent"
                      : "border-transparent"
                  }`}
                  title={wall.name}
                >
                  {/\.(mp4|webm)$/i.test(wall.url) ? (
                    <span className="flex h-12 w-20 items-center justify-center bg-foreground/10 text-xs">
                      🎬 视频
                    </span>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={wall.url} alt="" className="h-12 w-20 object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">壁纸虚化强度</span>
            <span className="opacity-60">{wallBlur} px</span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            value={wallBlur}
            onChange={(e) => setWallBlur(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--accent)]"
          />
        </div>

        {/* 壁纸轮播:全站默认;访客可在导航栏 🖼️ 面板设置只属于自己的偏好 */}
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">🖼️ 壁纸轮播(全站默认)</span>
            <button
              onClick={() =>
                patchValues({
                  wall_carousel_enabled: carouselEnabled ? "0" : "1",
                })
              }
              disabled={busy}
              className={`rounded-full px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
                carouselEnabled ? "bg-accent text-white" : "border border-border opacity-70"
              }`}
            >
              {carouselEnabled ? "轮播中" : "已关闭"}
            </button>
          </div>
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>切换间隔</span>
              <span>{carouselSeconds} 秒</span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              value={carouselSeconds}
              onChange={(e) => setCarouselSeconds(Number(e.target.value))}
              className="mt-1.5 w-full accent-[var(--accent)]"
            />
          </div>
          <p className="mt-1.5 text-[10px] opacity-40">
            轮播范围 = 夜间/白天壁纸 + 壁纸库全部文件;访客可在导航栏 🖼️ 里设置只属于自己的节奏。
          </p>
        </div>
      </div>

      {/* 点歌台:歌单存数据库,上传/外链/网易云自由加歌 */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold">点歌台(共 {songs.length} 首)</h3>
        <p className="mt-1 text-xs opacity-50">
          上传 mp3、贴外链、或粘贴网易云歌曲链接自由加歌;导航栏、首页卡片、左下角圆盘用的是同一份歌单。
        </p>

        <ul className="mt-3 space-y-2">
          {songs.map((song, index) => (
            <li
              key={`${song.url}-${index}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="min-w-0 truncate">
                {song.url.startsWith("netease:") ? "🎧" : "🎵"} {song.title}
                <span className="ml-2 opacity-50">{song.artist}</span>
              </span>
              <button
                onClick={() => deleteSong(index)}
                disabled={busy}
                className="shrink-0 text-red-500 hover:underline disabled:opacity-50"
              >
                删除
              </button>
            </li>
          ))}
          {songs.length === 0 && (
            <li className="text-sm opacity-50">歌单是空的。</li>
          )}
        </ul>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => songInputRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-border px-4 py-2 text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            ⬆ 上传歌曲(mp3)
          </button>
          <input
            ref={songInputRef}
            type="file"
            accept="audio/mpeg,audio/wav"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) uploadSong(file);
            }}
          />
          <span className="text-xs opacity-40">或</span>
          <input
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            placeholder="歌名"
            className="w-28 rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={songUrl}
            onChange={(e) => setSongUrl(e.target.value)}
            placeholder="歌曲外链地址"
            className="w-44 rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={addSongByUrl}
            disabled={busy}
            className="rounded-lg border border-border px-3 py-2 text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            添加外链
          </button>
        </div>

        {/* 网易云歌单:粘贴歌单链接或编号,全站音乐卡变成完整歌单播放器 */}
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm font-semibold">🎧 网易云歌单(推荐)</p>
          <p className="mt-1 text-xs opacity-50">
            在网易云创建/收藏一个公开歌单,把歌单链接或编号粘贴到这里——首页音乐卡和导航栏播放器会变成完整的歌单播放器(官方外链,含歌词)。
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <input
              value={playlistInput}
              onChange={(e) => setPlaylistInput(e.target.value)}
              placeholder="如 https://music.163.com/playlist?id=xxxx 或纯数字"
              className="w-64 rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={async () => {
                const id = parseNeteasePlaylistId(playlistInput);
                if (!id) {
                  setStatus("没解析出网易云歌单编号");
                  return;
                }
                const ok = await patchValues({ netease_playlist_id: id });
                if (ok) setStatus("歌单已绑定 ✓");
              }}
              disabled={busy}
              className="rounded-lg border border-border px-3 py-2 text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              绑定歌单
            </button>
            <button
              onClick={() => {
                setPlaylistInput("");
                patchValues({ netease_playlist_id: null });
              }}
              disabled={busy}
              className="text-sm text-accent hover:underline disabled:opacity-50"
            >
              解绑
            </button>
          </div>
        </div>

        {/* 网易云:粘贴歌曲链接或 ID,用官方外链播放器直接播放 */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs opacity-40">🎧</span>
          <input
            value={neteaseInput}
            onChange={(e) => setNeteaseInput(e.target.value)}
            placeholder="粘贴网易云歌曲链接或纯数字 ID"
            className="w-56 rounded-lg border border-border bg-transparent px-2.5 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={addNetease}
            disabled={busy}
            className="rounded-lg border border-border px-3 py-2 text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            加网易云
          </button>
        </div>
      </div>

      {/* 签名 + 公告 */}
      <div className="glass space-y-4 rounded-2xl p-5">
        <div>
          <label className="text-sm font-semibold">一句话签名</label>
          <input
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            className={`${inputClass} mt-2`}
          />
        </div>
        <div>
          <label className="text-sm font-semibold">打字机横幅句子(每行一句,最多 10 句)</label>
          <textarea
            value={announcements}
            onChange={(e) => setAnnouncements(e.target.value)}
            rows={4}
            className={`${inputClass} mt-2`}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {status && <span className="text-sm opacity-70">{status}</span>}
        <button
          onClick={save}
          disabled={busy}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "保存中…" : "保存设置"}
        </button>
      </div>
    </div>
  );
}
