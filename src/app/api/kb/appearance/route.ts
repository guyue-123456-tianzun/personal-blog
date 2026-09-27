import { NextResponse } from "next/server";

import { getSessionUsername } from "@/lib/session";
import {
  APPEARANCE_KEYS,
  clearSetting,
  getAppearance,
  setSetting,
  type AppearanceKey,
} from "@/lib/settings";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// 每个键的取值校验/规整:非法值在这里被拦下或修正
const VALIDATORS: Record<AppearanceKey, (value: string) => string> = {
  hero_image_url: (v) => {
    if (!v || v.length > 500) throw new Error("背景图地址不合法");
    return v;
  },
  avatar_url: (v) => {
    if (!v || v.length > 500) throw new Error("头像地址不合法");
    return v;
  },
  hero_blur: (v) => String(clamp(Math.round(Number(v)) || 0, 0, 24)),
  hero_height: (v) => String(clamp(Math.round(Number(v)) || 70, 40, 100)),
  signature: (v) => v.slice(0, 200),
  announcements: (v) => {
    const parsed = JSON.parse(v) as unknown;
    if (!Array.isArray(parsed)) throw new Error("公告格式不正确");
    return JSON.stringify(parsed.map(String).filter(Boolean).slice(0, 10));
  },
  wall_image_url: (v) => {
    if (!v || v.length > 500) throw new Error("壁纸地址不合法");
    return v;
  },
  wall_image_url_day: (v) => {
    if (!v || v.length > 500) throw new Error("壁纸地址不合法");
    return v;
  },
  hero_image_url_day: (v) => {
    if (!v || v.length > 500) throw new Error("背景图地址不合法");
    return v;
  },
  wall_blur: (v) => String(clamp(Math.round(Number(v)) || 0, 0, 30)),
  wall_carousel_enabled: (v) => (v === "0" ? "0" : "1"),
  wall_carousel_seconds: (v) =>
    String(clamp(Math.round(Number(v)) || 3, 1, 60)),
  music: (v) => {
    const parsed = JSON.parse(v) as unknown;
    if (!Array.isArray(parsed)) throw new Error("歌单格式不正确");
    if (parsed.length > 50) throw new Error("歌单最多 50 首");
    const songs = parsed
      .filter(
        (song): song is { title: string; artist?: string; url: string } =>
          !!song &&
          typeof (song as { title?: unknown }).title === "string" &&
          typeof (song as { url?: unknown }).url === "string",
      )
      .map((song) => ({
        title: song.title.slice(0, 100),
        artist: String(song.artist ?? "").slice(0, 100),
        url: song.url.slice(0, 500),
      }));
    return JSON.stringify(songs);
  },
};

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(await getAppearance());
}

// 批量保存:values 里每个键都会过校验;值为 null 表示清除该项(回落默认)
export async function PATCH(request: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    values?: Record<string, string | null>;
  } | null;
  if (!body?.values) {
    return NextResponse.json({ error: "缺少 values" }, { status: 400 });
  }

  try {
    for (const [key, raw] of Object.entries(body.values)) {
      if (!APPEARANCE_KEYS.includes(key as AppearanceKey)) {
        return NextResponse.json({ error: `未知的设置项:${key}` }, { status: 400 });
      }
      if (raw === null) {
        await clearSetting(key as AppearanceKey);
      } else {
        const value = VALIDATORS[key as AppearanceKey](raw);
        await setSetting(key as AppearanceKey, value);
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存失败" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, appearance: await getAppearance() });
}

// 清除某项设置(回落默认值)
export async function DELETE(request: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as { key?: string } | null;
  if (!body?.key || !APPEARANCE_KEYS.includes(body.key as AppearanceKey)) {
    return NextResponse.json({ error: "未知的设置项" }, { status: 400 });
  }
  await clearSetting(body.key as AppearanceKey);
  return NextResponse.json({ ok: true, appearance: await getAppearance() });
}
