"use client";

import { useEffect, useRef } from "react";

// 星系背景:动态星空。
// - 三层星星以不同速度缓慢漂移,近的快、远的慢,形成视差(所以看起来有纵深)
// - 每颗星按各自的相位闪烁,不是整齐划一地亮暗
// - 每隔几秒划过一颗流星
// - 系统里开了"减少动态效果"就只画一张静态星空,不做动画
//
// 用 canvas 而不是 CSS 动画:几百颗星加流星,用 DOM 会拖垮主线程;
// 星星画在 canvas 上,星云用 CSS 径向渐变(它不需要动)。

type Star = {
  x: number;
  y: number;
  r: number;
  layer: number;
  phase: number;
  twinkle: number;
  color: string;
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
};

// 星空配色:以白为主,掺少量偏蓝/偏粉/偏暖的星,星系才有层次
const STAR_COLORS = [
  "#ffffff",
  "#ffffff",
  "#ffffff",
  "#d7e6ff",
  "#ffe0f0",
  "#fff6dd",
];

const LAYER_SPEED = [
  { vx: 0.018, vy: 0.01, r: 0.9 },
  { vx: 0.05, vy: 0.028, r: 1.25 },
  { vx: 0.11, vy: 0.06, r: 1.7 },
];

export default function GalaxyBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let meteor: Meteor | null = null;
    let nextMeteorAt = 2000;
    let elapsed = 0;
    let frame = 0;
    let lastTime = performance.now();

    const buildStars = () => {
      // 星数跟屏幕面积走,大屏不至于稀稀拉拉,小屏不至于糊成一片
      const count = Math.min(420, Math.round((width * height) / 5200));
      stars = Array.from({ length: count }, () => {
        const layer = Math.floor(Math.random() * 3);
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: LAYER_SPEED[layer].r * (0.7 + Math.random() * 0.7),
          layer,
          phase: Math.random() * Math.PI * 2,
          twinkle: 0.6 + Math.random() * 1.6,
          color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        };
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    const drawStars = () => {
      for (const star of stars) {
        const twinkle =
          0.45 + 0.55 * (0.5 + 0.5 * Math.sin(elapsed * 0.0012 * star.twinkle + star.phase));
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawMeteor = () => {
      if (!meteor) return;
      const progress = 1 - meteor.life / meteor.max;
      const tailX = meteor.x - meteor.vx * 14;
      const tailY = meteor.y - meteor.vy * 14;
      const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
      gradient.addColorStop(0, "rgba(255,255,255,0.95)");
      gradient.addColorStop(0.35, "rgba(180,205,255,0.45)");
      gradient.addColorStop(1, "rgba(180,205,255,0)");
      ctx.globalAlpha = Math.sin(Math.PI * progress) * 0.9;
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(meteor.x, meteor.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      // 流星头部加一点亮斑
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(meteor.x, meteor.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const render = (dt: number) => {
      ctx.clearRect(0, 0, width, height);

      if (!reduceMotion) {
        for (const star of stars) {
          const speed = LAYER_SPEED[star.layer];
          star.x += speed.vx * dt;
          star.y += speed.vy * dt;
          if (star.x > width + 4) star.x = -4;
          if (star.y > height + 4) star.y = -4;
        }
        elapsed += dt;

        if (meteor) {
          meteor.x += meteor.vx * dt;
          meteor.y += meteor.vy * dt;
          meteor.life -= dt;
          if (meteor.life <= 0) meteor = null;
        } else if (elapsed > nextMeteorAt) {
          const startX = width * (0.15 + Math.random() * 0.7);
          meteor = {
            x: startX,
            y: -20,
            vx: 2.6 + Math.random() * 1.4,
            vy: 1.3 + Math.random() * 0.7,
            life: 1400,
            max: 1400,
          };
          nextMeteorAt = elapsed + 5000 + Math.random() * 7000;
        }
      }

      drawStars();
      drawMeteor();
    };

    const loop = (now: number) => {
      const dt = Math.min(now - lastTime, 48); // 切回标签页时别一下子跳一大步
      lastTime = now;
      render(dt);
      frame = window.requestAnimationFrame(loop);
    };

    // 标签页在后台时不烧 CPU
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* 星云:三团柔和的色斑,给星空一点"星系"的颜色层次(CSS 渐变,不用动画) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 18% 12%, rgba(96,64,190,0.42), transparent 70%)," +
            "radial-gradient(55% 45% at 82% 22%, rgba(36,86,168,0.38), transparent 70%)," +
            "radial-gradient(70% 55% at 55% 95%, rgba(128,44,150,0.30), transparent 72%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
