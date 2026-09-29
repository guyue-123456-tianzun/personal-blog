// 站点外观设置:存数据库(site_settings 表),后台"外观设置"页写入,前台即时生效。
// site-config.ts 里的静态值充当默认值——删掉某项设置就回落到默认,永远不会无图可用。
import fs from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { siteSettings } from "@/db/schema";
import { siteConfig } from "./site-config";

export const APPEARANCE_KEYS = [
  "hero_image_url",
  "hero_image_url_day",
  "avatar_url",
  "hero_blur",
  "hero_height",
  "signature",
  "announcements",
  "wall_image_url",
  "wall_image_url_day",
  "wall_blur",
  "wall_carousel_enabled",
  "wall_carousel_seconds",
  "netease_playlist_id",
  "love_enabled",
  "love_partner_nickname",
  "love_partner_avatar",
  "love_start_date",
  "weather_enabled",
  "weather_default_city",
  "weather_cities",
  "music",
] as const;

export type AppearanceKey = (typeof APPEARANCE_KEYS)[number];

export type Song = { title: string; artist: string; url: string };

export type Appearance = {
  heroImage: string; // 夜间 Hero
  heroImageDay: string; // 白天 Hero
  avatar: string;
  heroBlur: number; // 0~24 px(Hero 大图的虚化)
  heroHeightVh: number; // 40~100 (vh)
  signature: string;
  announcements: string[];
  wallImage: string; // 夜间沉浸式壁纸
  wallImageDay: string; // 白天沉浸式壁纸
  wallBlur: number; // 0~30 px(壁纸虚化,默认 18:能看清氛围又不抢内容)
  music: Song[]; // 歌单(点歌台管理,存数据库)
  neteasePlaylistId: string | null; // 网易云歌单编号(官方外链播放器)
  wallCarouselEnabled: boolean; // 壁纸轮播开关(全站默认)
  wallCarouselSeconds: number; // 轮播间隔秒数(1~60)
  wallLibrary: string[]; // 壁纸库:public/wallpapers/ 下的全部文件
  loveEnabled: boolean; // 恋爱模块卡片开关
  lovePartnerNickname: string | null; // 恋爱对象昵称(未填且无恋爱好友关系时显示单身)
  lovePartnerAvatar: string | null;
  loveStartDate: string | null; // 在一起的日期(YYYY-MM-DD)
  weatherEnabled: boolean; // 天气预报卡片开关
  weatherDefaultCity: string; // 默认城市
  weatherCities: string[]; // 备选城市列表(卡片里可切换)
};

/** 壁纸库:public/wallpapers/ 下的图片与视频文件(Wallpaper Engine 的 mp4 可直接丢进来) */
export function getWallLibrary(): string[] {
  const dir = path.join(process.cwd(), "public", "wallpapers");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => /\.(mp4|webm|png|jpe?g|webp)$/i.test(name))
    .sort()
    .map((name) => `/wallpapers/${name}`);
}

/** 白天模式的默认 Hero:一张阳光草地的日间插画 */
export const DAY_HERO_DEFAULT = "/images/hero-day-default.svg";

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

  let music: Song[] = siteConfig.music as unknown as Song[];
  try {
    const stored = map.get("music");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        music = parsed
          .filter(
            (song): song is Song =>
              !!song && typeof song.title === "string" && typeof song.url === "string",
          )
          .map((song) => ({
            title: String(song.title).slice(0, 100),
            artist: String(song.artist ?? "").slice(0, 100),
            url: String(song.url).slice(0, 500),
          }));
      }
    }
  } catch {
    // 同上:坏数据回落默认歌单
  }

  return {
    // Hero 图源:站长单独设过就用它,否则**跟随全站壁纸**——壁纸就是你选的绘梨衣,
    // 它本来就该是首屏那张脸,而不是被压在最底下当背景。
    // 只有两处都没设时才落到内置插画(保证全新站点也不会开天窗)
    heroImage:
      map.get("hero_image_url") ??
      map.get("wall_image_url") ??
      siteConfig.heroImage,
    // 白天 Hero:优先"白天"设置 → 夜间 Hero → 白天壁纸 → 夜间壁纸 → 日间默认插画
    heroImageDay:
      map.get("hero_image_url_day") ??
      map.get("hero_image_url") ??
      map.get("wall_image_url_day") ??
      map.get("wall_image_url") ??
      DAY_HERO_DEFAULT,
    avatar: map.get("avatar_url") ?? siteConfig.avatar,
    heroBlur: Number.isFinite(blur) ? clamp(blur, 0, 24) : 0,
    heroHeightVh: Number.isFinite(height) ? clamp(height, 40, 100) : 100,
    signature: map.get("signature") ?? siteConfig.signature,
    announcements: announcements.length > 0 ? announcements : ["欢迎来到我的个人站。"],
    // 夜间壁纸默认跟随夜间 Hero 图
    wallImage:
      map.get("wall_image_url") ??
      map.get("hero_image_url") ??
      siteConfig.heroImage,
    // 白天壁纸:优先"白天"设置,其次夜间壁纸,最后白天默认插画
    wallImageDay:
      map.get("wall_image_url_day") ??
      map.get("wall_image_url") ??
      map.get("hero_image_url") ??
      DAY_HERO_DEFAULT,
    wallBlur: Number.isFinite(wallBlur) ? clamp(wallBlur, 0, 30) : 18,
    music,
    // 壁纸轮播:站长可关;默认开启,间隔默认 3 秒(示例值,范围 1~60)
    wallCarouselEnabled: map.get("wall_carousel_enabled") !== "0",
    wallCarouselSeconds: clamp(
      Number.isFinite(Number(map.get("wall_carousel_seconds")))
        ? Math.round(Number(map.get("wall_carousel_seconds")))
        : 3,
      1,
      60,
    ),
    wallLibrary: getWallLibrary(),
    neteasePlaylistId: map.get("netease_playlist_id") ?? null,
    loveEnabled: map.get("love_enabled") === "1",
    lovePartnerNickname: map.get("love_partner_nickname") ?? null,
    lovePartnerAvatar: map.get("love_partner_avatar") ?? null,
    loveStartDate: map.get("love_start_date") ?? null,
    weatherEnabled: map.get("weather_enabled") !== "0", // 默认开
    weatherDefaultCity: map.get("weather_default_city") ?? "北京",
    weatherCities: (map.get("weather_cities") ?? "")
      .split(/[,，]/)
      .map((c) => c.trim())
      .filter(Boolean),
  };
}

/**
 * 站长头像:外观后台设置的那一张。
 * 公开区所有"站长"身份的头像都该走它——users 表里的 avatarUrl 没有编辑入口,历来为空,
 * 只看后者的话,站长改完头像个人主页/说说流还是默认图。
 * 单独读一个键而不是 getAppearance:说说流每渲染一次不该顺带扫一遍壁纸目录
 */
export async function getSiteAvatar(): Promise<string | null> {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, "avatar_url"))
    .limit(1);
  return row?.value ?? null;
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
