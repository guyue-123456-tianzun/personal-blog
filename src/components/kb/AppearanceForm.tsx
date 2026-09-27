"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { Appearance } from "@/lib/settings";

type Props = { initial: Appearance };

// 外观设置表单:换背景图/头像(上传即存)、虚化强度、Hero 占屏高度、签名、公告。
// 图片上传后立即生效;其余点"保存设置"一次写入。
export default function AppearanceForm({ initial }: Props) {
  const router = useRouter();
  const [heroImage, setHeroImage] = useState(initial.heroImage);
  const [avatar, setAvatar] = useState(initial.avatar);
  const [blur, setBlur] = useState(initial.heroBlur);
  const [height, setHeight] = useState(initial.heroHeightVh);
  const [signature, setSignature] = useState(initial.signature);
  const [announcements, setAnnouncements] = useState(
    initial.announcements.join("\n"),
  );
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  async function uploadImage(
    kind: "hero_image_url" | "avatar_url",
    file: File,
  ) {
    setBusy(true);
    setStatus("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("public", "1"); // 背景图/头像必须访客可见
      const uploadRes = await fetch("/api/kb/attachments", {
        method: "POST",
        body: form,
      });
      const uploaded = (await uploadRes.json().catch(() => ({}))) as {
        error?: string;
        attachment?: { id: number };
      };
      if (!uploadRes.ok || !uploaded.attachment) {
        setStatus(uploaded.error ?? "上传失败");
        return;
      }
      const url = `/api/kb/attachments/${uploaded.attachment.id}`;
      const saveRes = await fetch("/api/kb/appearance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: { [kind]: url } }),
      });
      if (!saveRes.ok) {
        const data = (await saveRes.json().catch(() => ({}))) as { error?: string };
        setStatus(data.error ?? "保存失败");
        return;
      }
      if (kind === "hero_image_url") setHeroImage(url);
      else setAvatar(url);
      setStatus("图片已更新 ✓");
      router.refresh();
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
        setAvatar(data.appearance.avatar);
        setBlur(data.appearance.heroBlur);
        setHeight(data.appearance.heroHeightVh);
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
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/kb/appearance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: {
            hero_blur: String(blur),
            hero_height: String(height),
            signature,
            announcements: JSON.stringify(
              announcements.split("\n").map((line) => line.trim()).filter(Boolean),
            ),
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setStatus(res.ok ? "已保存 ✓" : (data.error ?? "保存失败"));
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="space-y-6">
      {/* 实时预览 */}
      <div>
        <h3 className="mb-2 font-semibold">预览</h3>
        <div
          className="relative overflow-hidden rounded-2xl border border-border"
          style={{ height: Math.round((height / 100) * 320) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover"
            style={{ filter: `blur(${Math.round(blur * 0.5)}px)`, transform: "scale(1.08)" }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <p className="text-xl font-bold drop-shadow">{signature || "签名"}</p>
          </div>
        </div>
      </div>

      {/* 背景图 */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold">Hero 背景图</h3>
        <p className="mt-1 text-xs opacity-50">横图最佳;上传即生效,访客直接可见。</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => heroInputRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-border px-4 py-2 text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            上传新背景图
          </button>
          <button
            onClick={() => resetOne("hero_image_url")}
            disabled={busy}
            className="text-sm text-accent hover:underline disabled:opacity-50"
          >
            恢复默认
          </button>
          <input
            ref={heroInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) uploadImage("hero_image_url", file);
            }}
          />
        </div>
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

      {/* 虚化 + 高度滑杆 */}
      <div className="glass space-y-5 rounded-2xl p-5">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">背景虚化强度</span>
            <span className="opacity-60">{blur} px</span>
          </div>
          <input
            type="range"
            min={0}
            max={24}
            value={blur}
            onChange={(e) => setBlur(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--accent)]"
          />
        </div>
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Hero 占屏高度</span>
            <span className="opacity-60">{height} vh</span>
          </div>
          <input
            type="range"
            min={40}
            max={100}
            step={5}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--accent)]"
          />
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
          {busy ? "处理中…" : "保存设置"}
        </button>
      </div>
    </div>
  );
}
