"use client";

import { useEffect, useRef } from "react";

// 动态星系背景。
// - 星星绕中心缓慢公转,越靠里转得越快——这是真实的星系差速旋转,看起来才"活"
// - 三层角速度不同,形成纵深感
// - 每颗星按各自相位闪烁;少数亮星带十字星芒
// - 每隔几秒划过一颗流星
// - 系统开了"减少动态效果"就只画一张静态星空;标签页切到后台停帧
//
// 用 canvas 而不是 CSS 动画:上千颗星用 DOM 会拖垮主线程。
// 星云(不动的部分)用 CSS 径向渐变。

type Star = {
  radius: number; // 距中心的距离
  angle: number; // 当前角度
  speed: number; // 角速度(rad/ms)
  size: number;
  phase: number;
  twinkle: number;
  color: string;
  flare: boolean; // 是否画十字星芒
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
};

/** 星系的可调参数:大小 / 位置 / 立体倾斜 / 自转速度。
 *  工作台的「星系」面板改的就是这几个值,星空与图谱共用同一份,所以它们是一个整体 */
export type GalaxySettings = {
  /** 整体大小(1 = 原始) */
  scale: number;
  /** 中心位置偏移(相对画布宽高的比例,-0.5 ~ 0.5) */
  offsetX: number;
  offsetY: number;
  /** 立体倾斜角(弧度):0 = 正对着看,越大越像斜着看一个圆盘 */
  tilt: number;
  /** 自转速度倍率(0 = 停) */
  spinSpeed: number;
  /** 是否自动自转 */
  autoSpin: boolean;
};

export const DEFAULT_GALAXY: GalaxySettings = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  tilt: 0,
  spinSpeed: 1,
  autoSpin: true,
};

const STAR_COLORS = [
  "#ffffff",
  "#ffffff",
  "#ffffff",
  "#d7e6ff",
  "#ffe6f4",
  "#fff6dd",
  "#cdfaff",
];

// 三层角速度:内圈快、外圈慢(差速旋转)
const LAYER_ANGULAR_SPEED = [0.00005, 0.000028, 0.000014];
const LAYER_SIZE = [0.55, 0.85, 1.35];

export default function GalaxyBackground({
  settings = DEFAULT_GALAXY,
}: {
  settings?: GalaxySettings;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // 面板改参数时不要重建整个动画循环:把最新值放 ref,循环里读
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let maxRadius = 0;
    let stars: Star[] = [];
    let meteor: Meteor | null = null;
    let nextMeteorAt = 2500;
    let elapsed = 0;
    let frame = 0;
    let lastTime = performance.now();

    const buildStars = () => {
      // 密度跟屏幕面积走:大屏不至于稀稀拉拉,小屏也不至于糊成一片
      const count = Math.min(2000, Math.round((width * height) / 1250));
      stars = Array.from({ length: count }, () => {
        const layer = Math.floor(Math.random() * 3);
        // 半径取平方根分布,星点才会均匀铺满圆面而不是全挤在中心
        const radius = Math.sqrt(Math.random()) * maxRadius;
        return {
          radius,
          angle: Math.random() * Math.PI * 2,
          speed: LAYER_ANGULAR_SPEED[layer] * (0.85 + Math.random() * 0.3),
          size: LAYER_SIZE[layer] * (0.6 + Math.random() * 0.8),
          phase: Math.random() * Math.PI * 2,
          twinkle: 0.5 + Math.random() * 1.8,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
          // 约 2% 的星画十字星芒,点出"星"的感觉
          flare: Math.random() < 0.02,
        };
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = parent.clientWidth;
      height = parent.clientHeight;
      maxRadius = Math.hypot(width, height) * 0.62;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    };    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    const render = (dt: number) => {
      const s = settingsRef.current;
      const cx = width / 2 + s.offsetX * width;
      const cy = height * 0.52 + s.offsetY * height;
      const cosTilt = Math.cos(s.tilt); // 立体倾斜:把圆盘的纵向压扁,看起来就是"斜着看"
      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        if (!reduceMotion && s.autoSpin) {
          star.angle += star.speed * s.spinSpeed * dt;
        }
        const r = star.radius * s.scale;
        const x = cx + Math.cos(star.angle) * r;
        const y = cy + Math.sin(star.angle) * r * cosTilt;
        const twinkle = reduceMotion
          ? 0.75
          : 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(elapsed * 0.0011 * star.twinkle + star.phase));
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = star.color;

        if (star.size < 0.9) {
          // 细小的星用方块画,比画圆快得多,肉眼看不出区别
          ctx.fillRect(x, y, star.size * 1.6, star.size * 1.6);
        } else {
          ctx.beginPath();
          ctx.arc(x, y, star.size, 0, Math.PI * 2);
          ctx.fill();
          if (star.flare) {
            // 十字星芒
            ctx.globalAlpha = twinkle * 0.5;
            ctx.strokeStyle = star.color;
            ctx.lineWidth = 0.7;
            const arm = star.size * 4.5;
            ctx.beginPath();
            ctx.moveTo(x - arm, y);
            ctx.lineTo(x + arm, y);
            ctx.moveTo(x, y - arm);
            ctx.lineTo(x, y + arm);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // 流星
      if (!reduceMotion) {
        if (meteor) {
          meteor.x += meteor.vx * dt;
          meteor.y += meteor.vy * dt;
          meteor.life -= dt;
          if (meteor.life <= 0) meteor = null;
        } else if (elapsed > nextMeteorAt) {
          meteor = {
            x: width * (0.15 + Math.random() * 0.7),
            y: -20,
            vx: 2.6 + Math.random() * 1.5,
            vy: 1.3 + Math.random() * 0.8,
            life: 1500,
            max: 1500,
          };
          nextMeteorAt = elapsed + 5000 + Math.random() * 7000;
        }
      }
      if (meteor) {
        const progress = 1 - meteor.life / meteor.max;
        const tailX = meteor.x - meteor.vx * 16;
        const tailY = meteor.y - meteor.vy * 16;
        const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
        gradient.addColorStop(0, "rgba(255,255,255,0.95)");
        gradient.addColorStop(0.35, "rgba(175,215,255,0.45)");
        gradient.addColorStop(1, "rgba(175,215,255,0)");
        ctx.globalAlpha = Math.sin(Math.PI * progress) * 0.9;
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (!reduceMotion) elapsed += dt;
    };

    const loop = (now: number) => {
      // 切回标签页时别一下子跳一大步
      const dt = Math.min(now - lastTime, 48);
      lastTime = now;
      render(dt);
      frame = window.requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(frame);
      } else {
        lastTime = performance.now();
        frame = window.requestAnimationFrame(loop);
      }
    };

    frame = window.requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* 星云:中心一团亮核 + 三团柔和的色斑,给星空"星系"的颜色层次(不动的部分用 CSS) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(38% 30% at 50% 52%, rgba(120,150,255,0.20), transparent 70%)," +
            "radial-gradient(60% 45% at 18% 12%, rgba(96,64,190,0.40), transparent 70%)," +
            "radial-gradient(55% 45% at 82% 22%, rgba(36,86,168,0.36), transparent 70%)," +
            "radial-gradient(70% 55% at 55% 95%, rgba(128,44,150,0.28), transparent 72%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
