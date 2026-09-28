"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { NOTE_TYPE_COLOR, noteTypeColor, noteTypeLabel } from "@/lib/content-types";
import {
  DEFAULT_GALAXY,
  type GalaxySettings,
} from "@/components/atlas/GalaxyBackground";
import type { GraphData, GraphNode } from "@/lib/graph";

// 知识图谱:Obsidian 那种关系图。
// - 力学布局:节点之间互斥、有连线的互相拉,自动散开成一个网络
// - 拖动节点、空白处平移画布、点节点看摘要
// - 筛选(搜索标题 / 只看有连线的)、调节点大小、连线粗细、文字透明度
//
// 为什么用 canvas 而不是 SVG:每帧都要重画所有节点与连线,用 React 状态驱动上百个
// SVG 元素会很卡;canvas 直接画,几十上百个节点都顺。颜色从 CSS 变量读,深浅色跟着变。

type SimNode = {
  id: number;
  x: number;
  y: number;
  /** 深度:只为让星系有厚度(纯视觉,没有语义),倾斜+透视时才有前后感 */
  z: number;
  /** 水滴浮动的相位/幅度/速度:每颗星各漂各的,才不会整片一起晃 */
  phase: number;
  bobAmp: number;
  bobSpeed: number;
  vx: number;
  vy: number;
  degree: number;
  dragging: boolean;
};

// 节点配色与中文名来自 lib/content-types.ts(全站一份,见那里的注释)
const TYPE_COLOR = NOTE_TYPE_COLOR;

/** #RRGGBB → rgba(...):画光晕的径向渐变需要带透明度的颜色 */
function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const REPULSION = 11000; // 节点之间的斥力
const LINK_LENGTH = 96; // 连线的自然长度
const LINK_STRENGTH = 0.028; // 连线像弹簧的硬度
const CENTER_STRENGTH = 0.012; // 往画面中心收的力
const DAMPING = 0.85; // 阻尼:越大越"活",越小越快停
const ALPHA_FLOOR = 0.014; // 冷却到这个值就停下,不再空转

export default function KnowledgeGraph({
  data,
  mode,
  variant = "card",
  onOpenNode,
  galaxy,
}: {
  data: GraphData;
  mode: "private" | "public";
  /** card = 一张卡片(默认);fill = 撑满父容器(工作台里用) */
  variant?: "card" | "fill";
  /** 传了就把弹窗里的"打开"做成回调(工作台用它切到阅读模式),没传就跳转到 href */
  onOpenNode?: (id: number) => void;
  /** 星系参数(大小/位置/立体倾斜/自转),工作台的「星系」面板在改。
   *  不传就用内置默认值,自转开关退回到工具栏里那个勾选框 */
  galaxy?: GalaxySettings;
}) {
  const isFill = variant === "fill";
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<{ nodes: SimNode[]; alpha: number; pan: { x: number; y: number } }>({
    nodes: [],
    alpha: 1,
    pan: { x: 0, y: 0 },
  });
  const runningRef = useRef(true);
  const hoverRef = useRef<number | null>(null);
  const needsRedrawRef = useRef(true);
  // 自转角度(弧度):只在绘制时用,不动节点坐标
  const spinAngleRef = useRef(0);
  // 星系参数放 ref:面板拖滑杆时不要重建整个动画循环
  const galaxyRef = useRef<GalaxySettings>(galaxy ?? DEFAULT_GALAXY);
  galaxyRef.current = galaxy ?? DEFAULT_GALAXY;
  // 是否接了星系面板(决定自转听面板的还是听工具栏那个勾选框),也放 ref,免得进依赖
  const hasGalaxyRef = useRef(galaxy !== undefined);
  hasGalaxyRef.current = galaxy !== undefined;
  // 动画时钟:水滴浮动按它走,一帧一帧推进
  const elapsedRef = useRef(0);

  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [query, setQuery] = useState("");
  const [hideIsolated, setHideIsolated] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  /** 自转:像星系那样缓慢旋转(默认开;拖动时会自动暂停) */
  const [spin, setSpin] = useState(true);
  /** 同标签关联(虚线):共用标签的笔记之间连一条,给图谱补上"内容聚类"的线索 */
  const [showTagLinks, setShowTagLinks] = useState(true);
  const [nodeScale, setNodeScale] = useState(1);
  const [linkWidth, setLinkWidth] = useState(1);
  const [labelOpacity, setLabelOpacity] = useState(0.8);

  // 连线数:决定节点大小(连得越多越大),和 Obsidian 一致
  const degree = useMemo(() => {
    const map = new Map<number, number>();
    for (const edge of data.edges) {
      map.set(edge.from, (map.get(edge.from) ?? 0) + 1);
      map.set(edge.to, (map.get(edge.to) ?? 0) + 1);
    }
    return map;
  }, [data.edges]);

  // 筛选后的节点与连线
  const view = useMemo(() => {
    const nodes = hideIsolated
      ? data.nodes.filter((n) => (degree.get(n.id) ?? 0) > 0)
      : data.nodes;
    const ids = new Set(nodes.map((n) => n.id));
    const edges = data.edges.filter(
      (e) =>
        ids.has(e.from) &&
        ids.has(e.to) &&
        (showTagLinks || e.kind === "wiki"),
    );
    const q = query.trim().toLowerCase();
    // 搜索不删节点(删了整张图会跳),只标记命中、其余画暗
    const matched = q
      ? new Set(nodes.filter((n) => n.label.toLowerCase().includes(q)).map((n) => n.id))
      : null;
    return { nodes, edges, matched };
  }, [data, degree, hideIsolated, query, showTagLinks]);

  const nodeById = useMemo(
    () => new Map(view.nodes.map((n) => [n.id, n])),
    [view.nodes],
  );

  // 引用(实线)与同标签(虚线)分开计数:前者是"谁引用了谁",后者只是"内容相关"
  const counts = useMemo(() => {
    let wiki = 0;
    let tag = 0;
    for (const edge of view.edges) {
      if (edge.kind === "wiki") wiki++;
      else tag++;
    }
    return { wiki, tag };
  }, [view.edges]);

  // 视图变化时重建模拟(尽量沿用已有节点位置,避免整张图乱跳)
  useEffect(() => {
    const wrap = wrapRef.current;
    const w = wrap?.clientWidth ?? 800;
    const h = wrap?.clientHeight ?? 520;
    const previous = new Map(simRef.current.nodes.map((n) => [n.id, n]));
    const nodes: SimNode[] = view.nodes.map((node, index) => {
      const old = previous.get(node.id);
      const angle = (index / Math.max(1, view.nodes.length)) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.min(w, h) * 0.3;
      return {
        id: node.id,
        x: old?.x ?? w / 2 + radius * Math.cos(angle),
        y: old?.y ?? h / 2 + radius * Math.sin(angle),
        // 深度取一个由 id 决定的稳定伪随机值:同一篇笔记每次都在同一层,
        // 不会刷新一下就换前后关系
        z: old?.z ?? (((node.id * 2654435761) % 1000) / 1000 - 0.5) * 90,
        // 水滴浮动的参数:同一颗星每次进来都漂同一个节奏,不会刷新一下就换拍子
        phase: old?.phase ?? Math.random() * Math.PI * 2,
        bobAmp: old?.bobAmp ?? 1.6 + Math.random() * 2.4,
        bobSpeed: old?.bobSpeed ?? 0.7 + Math.random() * 0.9,
        vx: 0,
        vy: 0,
        degree: degree.get(node.id) ?? 0,
        dragging: false,
      };
    });
    simRef.current = { nodes, alpha: 1, pan: simRef.current.pan };
    runningRef.current = true;
    needsRedrawRef.current = true;
  }, [view, degree]);

  // 主循环:跑力学 + 需要时重绘
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = wrap.clientWidth;
      height = wrap.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      needsRedrawRef.current = true;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);

    // 主题色从"画布所在的容器"读,而不是从 <html> 读:
    // 工作台把自己包在 .dark 里(深空背景),从 html 读会拿到浅色主题的值,
    // 结果就是浅色文字配深色背景或者反过来,画出来看不清
    const cssColor = (name: string, fallback: string) => {
      const host = wrapRef.current ?? document.documentElement;
      return getComputedStyle(host).getPropertyValue(name).trim() || fallback;
    };
    // 深空模式(工作台):节点画成发光点、连线画成细光丝;浅色页面上就老老实实画实心圆
    const spaceMode = Boolean(wrap.closest(".dark"));

    const radiusOf = (node: SimNode) =>
      (4.5 + Math.min(node.degree, 8) * 1.7) * nodeScale;

    const step = (alpha: number) => {
      const nodes = simRef.current.nodes;
      const byId = new Map(nodes.map((n) => [n.id, n]));
      // 互斥:任意两个节点互推(节点量级不大,O(n²) 够用)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 0.01) {
            dx = (Math.random() - 0.5) * 2;
            dy = (Math.random() - 0.5) * 2;
            d2 = 4;
          }
          const force = (REPULSION / d2) * alpha;
          const d = Math.sqrt(d2);
          const fx = (dx / d) * force;
          const fy = (dy / d) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
      // 连线:像弹簧把两端拉到固定距离
      for (const edge of view.edges) {
        const a = byId.get(edge.from);
        const b = byId.get(edge.to);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (d - LINK_LENGTH) * LINK_STRENGTH * alpha;
        a.vx += (dx / d) * force;
        a.vy += (dy / d) * force;
        b.vx -= (dx / d) * force;
        b.vy -= (dy / d) * force;
      }
      // 向心力 + 积分
      for (const node of nodes) {
        if (node.dragging) continue;
        node.vx += (width / 2 - node.x) * CENTER_STRENGTH * alpha;
        node.vy += (height / 2 - node.y) * CENTER_STRENGTH * alpha;
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= DAMPING;
        node.vy *= DAMPING;
      }
      return alpha * 0.992;
    };

    const draw = () => {
      const { nodes, pan } = simRef.current;
      const g = galaxyRef.current;
      const focusId = selected?.id ?? hoverRef.current;
      // 聚焦节点的邻居,用来高亮
      const neighbors = new Set<number>();
      if (focusId !== undefined && focusId !== null) {
        neighbors.add(focusId);
        for (const edge of view.edges) {
          if (edge.from === focusId) neighbors.add(edge.to);
          if (edge.to === focusId) neighbors.add(edge.from);
        }
      }
      const focused = neighbors.size > 0;

      // ==== 立体投影 ====
      // 节点坐标 → 绕 Z 自转(星系自转)→ 绕 X 倾斜(立体感)→ 弱透视。
      // 关键点:**先算出每个节点的屏幕坐标存下来**,连线、节点、文字都用这份坐标画。
      // 这样文字不必跟着图形一起转 —— 星系在转,标题始终是水平的,才扫得清每个知识点
      const cx = width / 2 + pan.x + g.offsetX * width;
      const cy = height / 2 + pan.y + g.offsetY * height;
      const cosR = Math.cos(spinAngleRef.current);
      const sinR = Math.sin(spinAngleRef.current);
      const cosT = Math.cos(g.tilt);
      const sinT = Math.sin(g.tilt);
      const screen = new Map<number, { x: number; y: number; depth: number }>();
      for (const node of nodes) {
        const bx = (node.x - width / 2) * g.scale;
        const by = (node.y - height / 2) * g.scale;
        const bz = node.z * g.scale;
        const rx = bx * cosR - by * sinR;
        const ry = bx * sinR + by * cosR;
        const ty = ry * cosT - bz * sinT; // 倾斜把纵向压扁 → 圆盘看起来是斜的
        const tz = ry * sinT + bz * cosT; // 由此产生的深度
        const p = 1 / (1 - tz / 2200); // 弱透视:靠前的略大一点
        // 水滴浮动:上下左右各有相位,漂起来像水滴,图谱才不会定住
        const bobX =
          Math.sin(elapsedRef.current * 0.00034 * node.bobSpeed + node.phase) *
          node.bobAmp;
        const bobY =
          Math.cos(elapsedRef.current * 0.00026 * node.bobSpeed + node.phase * 1.7) *
          node.bobAmp *
          0.75;
        screen.set(node.id, { x: cx + rx * p + bobX, y: cy + ty * p + bobY, depth: tz });
      }
      // 远的先画、近的后画,近的才会叠在上面
      const drawOrder = [...nodes].sort(
        (a, b) => (screen.get(a.id)?.depth ?? 0) - (screen.get(b.id)?.depth ?? 0),
      );

      ctx.clearRect(0, 0, width, height);

      // 连线:深空里画成细光丝,浅色页面上还是普通细线。
      // 同标签关联画成虚线——它是"内容相关",不是"这篇引用了那篇",视觉上要能区分
      ctx.lineWidth = spaceMode ? Math.max(linkWidth * 0.7, 0.5) : linkWidth;
      for (const edge of view.edges) {
        const a = screen.get(edge.from);
        const b = screen.get(edge.to);
        if (!a || !b) continue;
        const isTag = edge.kind === "tag";
        const dim = focused && !(neighbors.has(edge.from) && neighbors.has(edge.to));
        ctx.setLineDash(isTag ? [3, 4] : []);
        ctx.strokeStyle = isTag
          ? spaceMode
            ? "rgba(190,180,255,0.38)"
            : "rgba(140,130,180,0.32)"
          : spaceMode
            ? "rgba(150,200,255,0.55)"
            : cssColor("--border", "rgba(120,120,140,0.35)");
        ctx.globalAlpha = dim ? 0.12 : isTag ? 0.7 : spaceMode ? 0.32 : 0.7;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // 节点:深空里画成发光点(外光晕 + 实心核 + 中心高光),浅色页面上画实心圆。
      // 浮动参数已经并进投影坐标里了,连线、节点、标题跟着同一份坐标走,不会各漂各的
      for (const node of drawOrder) {
        const meta = nodeById.get(node.id);
        const pos = screen.get(node.id)!;
        const color = noteTypeColor(meta?.type ?? "");
        const radius = radiusOf(node);
        const dim = (focused && !neighbors.has(node.id)) ||
          (view.matched ? !view.matched.has(node.id) : false);
        ctx.globalAlpha = dim ? 0.18 : 1;

        if (spaceMode) {
          const glow = ctx.createRadialGradient(
            pos.x,
            pos.y,
            radius * 0.3,
            pos.x,
            pos.y,
            radius * 3.6,
          );
          glow.addColorStop(0, hexToRgba(color, 0.75));
          glow.addColorStop(0.35, hexToRgba(color, 0.28));
          glow.addColorStop(1, hexToRgba(color, 0));
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius * 3.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius * 0.78, 0, Math.PI * 2);
          ctx.fill();

          // 中心高光:让它看起来是"自己在发光",而不是被照亮的圆点
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius * 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }

        if (node.id === focusId) {
          ctx.lineWidth = spaceMode ? 1.2 : 2;
          ctx.strokeStyle = spaceMode ? "#ffffff" : cssColor("--foreground", "#1c1c28");
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius * (spaceMode ? 2.4 : 1), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 标签:画在投影后的坐标上,不跟图形一起转 —— 星系在转,标题始终水平,扫得清
      if (showLabels) {
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.font =
          "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif";
        ctx.fillStyle = spaceMode
          ? "rgba(234,240,255,0.95)"
          : cssColor("--foreground", "#1c1c28");
        if (spaceMode) {
          ctx.shadowColor = "rgba(0,0,0,0.9)";
          ctx.shadowBlur = 6;
        }
        for (const node of drawOrder) {
          const meta = nodeById.get(node.id);
          if (!meta) continue;
          const pos = screen.get(node.id)!;
          const dim = (focused && !neighbors.has(node.id)) ||
            (view.matched ? !view.matched.has(node.id) : false);
          ctx.globalAlpha = dim ? labelOpacity * 0.25 : labelOpacity;
          ctx.fillText(meta.label.slice(0, 12), pos.x, pos.y + radiusOf(node) * 2 + 3);
        }
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    };

    // 自转速度按"每毫秒多少弧度"算,所以要先知道这一帧过了多久
    let lastFrame = performance.now();
    const loop = (now: number) => {
      const gap = Math.min(now - lastFrame, 48);
      lastFrame = now;
      elapsedRef.current += gap;
      const state = simRef.current;
      const dragging = state.nodes.some((n) => n.dragging);
      const g = galaxyRef.current;
      // 接了星系面板就归面板管;没接就退回工具栏里那个勾选框(公开的 /network 用)
      const autoSpin = hasGalaxyRef.current ? g.autoSpin : spin;
      const spinning = autoSpin && !dragging && state.nodes.length > 1;
      if (spinning) {
        spinAngleRef.current += 0.000042 * g.spinSpeed * gap;
      }
      const active = runningRef.current && state.alpha > ALPHA_FLOOR;
      if (active) state.alpha = step(state.alpha);
      // 每帧都画:水滴浮动是连续的(物理只在还没冷却时才跑)
      draw();
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [view, nodeById, nodeScale, linkWidth, labelOpacity, showLabels, selected, spin]);

  // 弹窗开着时按 Esc 关掉
  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // 指针交互:拖节点 / 平移画布 / 点节点看内容
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dragNode: SimNode | null = null;
    let panning = false;
    let last = { x: 0, y: 0 };
    let moved = 0;

    const toWorld = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const g = galaxyRef.current;
      const pan = simRef.current.pan;
      // 屏幕 → 世界:把投影反着做一遍。
      // 透视(靠前的节点略大)会让"看到的坐标"和"真实坐标"差出几个像素,
      // 比节点命中半径还大,所以要用两三轮迭代把它还回去,不然点了跟没点一样
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      const cx = cw / 2 + pan.x + g.offsetX * cw;
      const cy = ch / 2 + pan.y + g.offsetY * ch;
      const dx = event.clientX - rect.left - cx;
      const dy = event.clientY - rect.top - cy;
      const cosT = Math.cos(g.tilt);
      const sinT = Math.sin(g.tilt);
      const angle = spinAngleRef.current;
      let ry = dy / cosT;
      let p = 1;
      for (let i = 0; i < 3; i++) {
        const tz = ry * sinT;
        p = 1 / (1 - tz / 2200);
        ry = dy / (cosT * p);
      }
      const rx = dx / p;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      // 再反着转一下,还原自转
      const bx = rx * cosA + ry * sinA;
      const by = -rx * sinA + ry * cosA;
      return { x: cw / 2 + bx / g.scale, y: ch / 2 + by / g.scale };
    };

    const hitTest = (x: number, y: number) => {
      let best: SimNode | null = null;
      let bestDist = Infinity;
      for (const node of simRef.current.nodes) {
        const radius = (4.5 + Math.min(node.degree, 8) * 1.7) * nodeScale + 8;
        const d = Math.hypot(node.x - x, node.y - y);
        if (d <= radius && d < bestDist) {
          best = node;
          bestDist = d;
        }
      }
      return best;
    };

    const onDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      const point = toWorld(event);
      moved = 0;
      last = { x: event.clientX, y: event.clientY };
      const hit = hitTest(point.x, point.y);
      if (hit) {
        dragNode = hit;
        hit.dragging = true;
        runningRef.current = true;
      } else {
        panning = true;
      }
      needsRedrawRef.current = true;
    };

    const onMove = (event: PointerEvent) => {
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      if (dragNode) {
        const point = toWorld(event);
        dragNode.x = point.x;
        dragNode.y = point.y;
        dragNode.vx = 0;
        dragNode.vy = 0;
        simRef.current.alpha = Math.max(simRef.current.alpha, 0.4);
      } else if (panning) {
        simRef.current.pan = { x: simRef.current.pan.x + dx, y: simRef.current.pan.y + dy };
      } else {
        const point = toWorld(event);
        const hit = hitTest(point.x, point.y);
        const nextHover = hit?.id ?? null;
        if (nextHover !== hoverRef.current) {
          hoverRef.current = nextHover;
          needsRedrawRef.current = true;
        }
        canvas.style.cursor = hit ? "pointer" : "grab";
      }
      last = { x: event.clientX, y: event.clientY };
      needsRedrawRef.current = true;
    };

    const onUp = (event: PointerEvent) => {
      const point = toWorld(event);
      if (dragNode) {
        dragNode.dragging = false;
        // 几乎没移动 = 点击:弹出内容摘要
        if (moved < 5) {
          const hit = hitTest(point.x, point.y);
          setSelected(
            hit ? { ...nodeById.get(hit.id)! } : null,
          );
        }
        dragNode = null;
      } else if (panning && moved < 5) {
        setSelected(null);
      }
      panning = false;
      runningRef.current = true;
      needsRedrawRef.current = true;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
    };
  }, [nodeScale, nodeById]);

  const relayout = () => {
    const wrap = wrapRef.current;
    const w = wrap?.clientWidth ?? 800;
    const h = wrap?.clientHeight ?? 520;
    const nodes = simRef.current.nodes;
    nodes.forEach((node, index) => {
      const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.min(w, h) * 0.3;
      node.x = w / 2 + radius * Math.cos(angle);
      node.y = h / 2 + radius * Math.sin(angle);
      node.vx = 0;
      node.vy = 0;
    });
    simRef.current.pan = { x: 0, y: 0 };
    simRef.current.alpha = 1;
    runningRef.current = true;
    needsRedrawRef.current = true;
  };

  return (
    <div className={isFill ? "flex h-full flex-col gap-2" : "glass rounded-2xl p-4"}>
      {/* 工具条:搜索 / 筛选 / 重新布局 */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索标题,其余变暗…"
          className="w-44 rounded-lg border border-border bg-transparent px-2.5 py-1.5 outline-none focus:border-accent"
        />
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5">
          <input
            type="checkbox"
            checked={hideIsolated}
            onChange={(e) => setHideIsolated(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          只看有连线的
        </label>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          显示标题
        </label>
        {/* 自转开关只在"独立使用(没接星系面板)"时显示——接了面板就归面板管 */}
        {!galaxy && (
          <label
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5"
            title="整张图像星系一样缓慢旋转(拖动节点时会自动暂停)"
          >
            <input
              type="checkbox"
              checked={spin}
              onChange={(e) => setSpin(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            自转
          </label>
        )}
        <label
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5"
          title="共用同一个标签的笔记之间连虚线,表示内容相关(不是互相引用)"
        >
          <input
            type="checkbox"
            checked={showTagLinks}
            onChange={(e) => setShowTagLinks(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          同标签关联
        </label>
        <button
          onClick={relayout}
          className="rounded-lg border border-border px-2.5 py-1.5 transition-colors hover:bg-foreground/5"
        >
          ↻ 重新布局
        </button>
        <span className="ml-auto opacity-50">
          {view.nodes.length} 个节点 · {counts.wiki} 条引用
          {showTagLinks ? ` · ${counts.tag} 条同标签` : ""}
        </span>
      </div>

      {/* 外观调节 + 图例 */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs opacity-70">
        <label className="flex items-center gap-2">
          节点大小
          <input
            type="range"
            min={0.6}
            max={1.8}
            step={0.1}
            value={nodeScale}
            onChange={(e) => setNodeScale(Number(e.target.value))}
            className="w-20 accent-[var(--accent)]"
          />
        </label>
        <label className="flex items-center gap-2">
          连线粗细
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.5}
            value={linkWidth}
            onChange={(e) => setLinkWidth(Number(e.target.value))}
            className="w-20 accent-[var(--accent)]"
          />
        </label>
        <label className="flex items-center gap-2">
          文字透明度
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.1}
            value={labelOpacity}
            onChange={(e) => setLabelOpacity(Number(e.target.value))}
            className="w-20 accent-[var(--accent)]"
          />
        </label>
        <span className="flex flex-wrap items-center gap-2.5">
          {Object.entries(TYPE_COLOR).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: color }}
              />
              {noteTypeLabel(type)}
            </span>
          ))}
        </span>
      </div>

      {/* 一条引用线都还没有:直接告诉站长怎么连(同标签的虚线不算引用) */}
      {view.nodes.length > 0 && counts.wiki === 0 && (
        <p className="mt-3 rounded-lg border border-border px-3 py-2 text-xs leading-relaxed opacity-70">
          还没有互相引用。在任意一篇正文里写{" "}
          <code className="rounded bg-foreground/10 px-1 py-0.5">
            [[另一篇的标题]]
          </code>
          ,两篇之间就会连上实线;共用标签的笔记之间现在连的是虚线,只表示内容相关。
        </p>
      )}

      {/* 画布 */}
      <div
        ref={wrapRef}
        className={`relative w-full overflow-hidden rounded-xl border border-border ${
          isFill ? "min-h-0 flex-1" : "mt-3 h-[520px]"
        }`}
      >
        <canvas ref={canvasRef} className="block h-full w-full touch-none" />

        {view.nodes.length === 0 && (
          <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm opacity-60">
            这里还没有能连成图的内容。在正文里写 [[另一篇的标题]],两篇就会连上线。
          </p>
        )}

        {/* 点开节点:一个独立的小窗口展示这篇内容 */}
        {selected && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="pop-in w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-2xl"
            >
              {/* 标题栏:类型发光点 + 类型名 + 关闭 */}
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: noteTypeColor(selected.type),
                    boxShadow: `0 0 10px ${noteTypeColor(selected.type)}`,
                  }}
                />
                <span className="text-xs opacity-60">
                  {noteTypeLabel(selected.type)}
                </span>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="关闭"
                  className="ml-auto rounded-md px-1.5 py-0.5 text-xs opacity-50 transition-colors hover:bg-foreground/10 hover:opacity-100"
                >
                  ✕
                </button>
              </div>

              {/* 内容 */}
              <div className="px-4 py-4">
                <h3 className="text-base font-semibold leading-snug">
                  {selected.label}
                </h3>
                {selected.excerpt ? (
                  <p className="mt-2.5 max-h-60 overflow-y-auto whitespace-pre-wrap text-[13px] leading-relaxed opacity-75">
                    {selected.excerpt}
                  </p>
                ) : (
                  <p className="mt-2.5 text-[13px] opacity-50">
                    这篇还没有正文内容。
                  </p>
                )}
              </div>

              {/* 底部操作 */}
              <div className="flex items-center gap-3 border-t border-border px-4 py-2.5">
                {onOpenNode ? (
                  <button
                    onClick={() => {
                      onOpenNode(selected.id);
                      setSelected(null);
                    }}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs text-white transition-opacity hover:opacity-90"
                  >
                    打开全文 →
                  </button>
                ) : (
                  <Link
                    href={selected.href}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs text-white transition-opacity hover:opacity-90"
                  >
                    {mode === "public" ? "阅读这篇 →" : "打开原文 →"}
                  </Link>
                )}
                <span className="ml-auto text-[11px] opacity-40">
                  点空白处或 Esc 关闭
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className={`text-xs opacity-50 ${isFill ? "" : "mt-3"}`}>
        拖节点可以手动摆位置,空白处拖动是平移画布,点节点看摘要。节点越大表示连出去的线越多。
      </p>
    </div>
  );
}
