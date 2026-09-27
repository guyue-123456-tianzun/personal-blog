// 站点外观设置:存数据库(site_settings 表),后台"外观设置"页写入,前台即时生效。
// site-config.ts 里的静态值充当默认值——删掉某项设置就回落到默认,永远不会无图可用。
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { siteSettings } from "@/db/schema";
import { siteConfig } from "./site-config";

export const APPEARANCE_KEYS = [
  "hero_image_url",
  "avatar_url",
  "hero_blur",
  "hero_height",
  "signature",
  "announcements",
  "wall_image_url",
  "wall_blur",
] as const;

export type AppearanceKey = (typeof APPEARANCE_KEYS)[number];

export type Appearance = {
  heroImage: string;
  avatar: string;
  heroBlur: number; // 0~24 px(Hero 大图的虚化)
  heroHeightVh: number; // 40~100 (vh)
  signature: string;
  announcements: string[];
  wallImage: string; // 全站沉浸式壁纸(所有玻璃卡片垫在它上面)
  wallBlur: number; // 0~30 px(壁纸虚化,默认 18:能看清氛围又不抢内容)
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function getAppearance(): Promise<Appearance> {
  const rows = await db.select().from(siteSettings);
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const blur = Number(map.get("hero_blur"));
  const height = Number(map.get("hero_height"));
  const wallBlur = Number(map.get("wall_blur"));
  let announcements: string[] = siteConfig.announcements as unknown as string[];
  try {
    const stored = map.get("announcements");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) announcements = parsed.map(String);
    }
  } catch {
    // 存的值坏了就回落默认,页面不能因为配置挂掉
  }

  return {
    heroImage: map.get("hero_image_url") ?? siteConfig.heroImage,
    avatar: map.get("avatar_url") ?? siteConfig.avatar,
    heroBlur: Number.isFinite(blur) ? clamp(blur, 0, 24) : 0,
    heroHeightVh: Number.isFinite(height) ? clamp(height, 40, 100) : 70,
    signature: map.get("signature") ?? siteConfig.signature,
    announcements: announcements.length > 0 ? announcements : ["欢迎来到我的个人站。"],
    // 壁纸默认跟随 Hero 图:换一次 Hero 图,整站氛围跟着换
    wallImage:
      map.get("wall_image_url") ??
      map.get("hero_image_url") ??
      siteConfig.heroImage,
    wallBlur: Number.isFinite(wallBlur) ? clamp(wallBlur, 0, 30) : 18,
  };
}

export async function setSetting(key: AppearanceKey, value: string) {
  await db
    .insert(siteSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
}

export async function clearSetting(key: AppearanceKey) {
  await db.delete(siteSettings).where(eq(siteSettings.key, key));
}
