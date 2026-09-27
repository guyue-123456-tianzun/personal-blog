// 访客的主题偏好:全部存在访客自己的浏览器里(localStorage),只影响自己。
// 修改后派发 themeprefs 事件,监听的组件(壁纸/文章区/特效)实时跟随。

export type WallMode = "wallpaper" | "plain";
export type ArticleMode = "grid" | "list";

export type ThemePrefs = {
  accentH: number | null; // 主题色调(0~360),null = 站长默认
  wallMode: WallMode; // 壁纸模式:全屏壁纸 / 纯色简洁
  wallBlur: number | null; // 壁纸虚化覆盖(null = 站长默认)
  wallCarouselOn: boolean | null; // 壁纸轮播(null = 站长默认)
  wallCarouselSec: number | null; // 轮播间隔覆盖
  sakura: boolean; // 樱花飘落特效(默认开)
  particles: boolean; // Hero 漂浮粒子(默认开)
  articleMode: ArticleMode;
};

export const THEME_PREFS_EVENT = "themeprefs";

const KEYS = {
  accentH: "accentH",
  wallMode: "wallMode",
  wallBlur: "wallBlur",
  wallCarouselOn: "wallCarouselOn",
  wallCarouselSec: "wallCarouselSec",
  sakura: "sakura",
  particles: "particles",
  articleMode: "articleMode",
} as const;

export function readThemePrefs(): ThemePrefs {
  const prefs: ThemePrefs = {
    accentH: null,
    wallMode: "wallpaper",
    wallBlur: null,
    wallCarouselOn: null,
    wallCarouselSec: null,
    sakura: true,
    particles: true,
    articleMode: "grid",
  };
  try {
    const hue = Number(localStorage.getItem(KEYS.accentH));
    if (Number.isFinite(hue) && localStorage.getItem(KEYS.accentH) !== null) {
      prefs.accentH = ((Math.round(hue) % 360) + 360) % 360;
    }
    if (localStorage.getItem(KEYS.wallMode) === "plain") prefs.wallMode = "plain";
    const blur = Number(localStorage.getItem(KEYS.wallBlur));
    if (Number.isFinite(blur) && localStorage.getItem(KEYS.wallBlur) !== null) {
      prefs.wallBlur = Math.min(30, Math.max(0, Math.round(blur)));
    }
    const carouselOn = localStorage.getItem(KEYS.wallCarouselOn);
    if (carouselOn !== null) prefs.wallCarouselOn = carouselOn === "1";
    const sec = Number(localStorage.getItem(KEYS.wallCarouselSec));
    if (Number.isFinite(sec) && sec >= 1 && localStorage.getItem(KEYS.wallCarouselSec) !== null) {
      prefs.wallCarouselSec = Math.min(60, Math.round(sec));
    }
    const sakura = localStorage.getItem(KEYS.sakura);
    if (sakura !== null) prefs.sakura = sakura === "1";
    const particles = localStorage.getItem(KEYS.particles);
    if (particles !== null) prefs.particles = particles === "1";
    if (localStorage.getItem(KEYS.articleMode) === "list") prefs.articleMode = "list";
  } catch {
    // 隐私模式等场景 localStorage 不可用:全部回落默认
  }
  return prefs;
}

export function saveThemePrefs(partial: Partial<ThemePrefs>) {
  try {
    if (partial.accentH !== undefined) {
      if (partial.accentH === null) localStorage.removeItem(KEYS.accentH);
      else localStorage.setItem(KEYS.accentH, String(Math.round(partial.accentH)));
    }
    if (partial.wallMode !== undefined) localStorage.setItem(KEYS.wallMode, partial.wallMode);
    if (partial.wallBlur !== undefined) {
      if (partial.wallBlur === null) localStorage.removeItem(KEYS.wallBlur);
      else localStorage.setItem(KEYS.wallBlur, String(partial.wallBlur));
    }
    if (partial.wallCarouselOn !== undefined) {
      localStorage.setItem(KEYS.wallCarouselOn, partial.wallCarouselOn ? "1" : "0");
    }
    if (partial.wallCarouselSec !== undefined) {
      localStorage.setItem(KEYS.wallCarouselSec, String(partial.wallCarouselSec));
    }
    if (partial.sakura !== undefined) localStorage.setItem(KEYS.sakura, partial.sakura ? "1" : "0");
    if (partial.particles !== undefined) {
      localStorage.setItem(KEYS.particles, partial.particles ? "1" : "0");
    }
    if (partial.articleMode !== undefined) {
      localStorage.setItem(KEYS.articleMode, partial.articleMode);
    }
  } catch {
    // 忽略:本次会话通过事件仍可生效
  }
  window.dispatchEvent(new Event(THEME_PREFS_EVENT));
}

/** 把访客的主题色 hue 应用到根节点(--accent-h 驱动全套 accent 配色) */
export function applyAccentHue(hue: number | null) {
  if (hue === null) {
    document.documentElement.style.removeProperty("--accent-h");
  } else {
    document.documentElement.style.setProperty("--accent-h", String(Math.round(hue)));
  }
}
