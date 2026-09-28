"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { NOTE_TYPE_COLOR, noteTypeColor, noteTypeLabel } from "@/lib/content-types";
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
  vx: number;
  vy: number;
  degree: number;
  dragging: boolean;
};

// 节点配色与中文名来自 lib/content-types.ts(全站一份,见那里的注释)
const TYPE_COLOR = NOTE_TYPE_COLOR;

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
}: {
  data: GraphData;
  mode: "private" | "public";
  /** card = 一张卡片(默认);fill = 撑满父容器(工作台里用) */
  variant?: "card" | "fill";
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

  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [query, setQuery] = useState("");
  const [hideIsolated, setHideIsolated] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
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
    const edges = data.edges.filter((e) => ids.has(e.from) && ids.has(e.to));
    const q = query.trim().toLowerCase();
    // 搜索不删节点(删了整张图会跳),只标记命中、其余画暗
    const matched = q
      ? new Set(nodes.filter((n) => n.label.toLowerCase().includes(q)).map((n) => n.id))
      : null;
    return { nodes, edges, matched };
  }, [data, degree, hideIsolated, query]);

  const nodeById = useMemo(
    () => new Map(view.nodes.map((n) => [n.id, n])),
    [view.nodes],
  );

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

    const cssColor = (name: string, fallback: string) =>
      getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

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
      const byId = new Map(nodes.map((n) => [n.id, n]));
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

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(pan.x, pan.y);

      // 连线
      ctx.lineWidth = linkWidth;
      ctx.strokeStyle = cssColor("--border", "rgba(120,120,140,0.35)");
      for (const edge of view.edges) {
        const a = byId.get(edge.from);
        const b = byId.get(edge.to);
        if (!a || !b) continue;
        const dim = focused && !(neighbors.has(a.id) && neighbors.has(b.id));
        ctx.globalAlpha = dim ? 0.2 : 0.7;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 节点
      for (const node of nodes) {
        const meta = nodeById.get(node.id);
        const dim = (focused && !neighbors.has(node.id)) ||
          (view.matched ? !view.matched.has(node.id) : false);
        ctx.globalAlpha = dim ? 0.2 : 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radiusOf(node), 0, Math.PI * 2);
        ctx.fillStyle = noteTypeColor(meta?.type ?? "");
        ctx.fill();
        if (node.id === focusId) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = cssColor("--foreground", "#1c1c28");
          ctx.stroke();
        }
      }

      // 标签
      if (showLabels) {
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.font =
          "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif";
        ctx.fillStyle = cssColor("--foreground", "#1c1c28");
        for (const node of nodes) {
          const meta = nodeById.get(node.id);
          if (!meta) continue;
          const dim = (focused && !neighbors.has(node.id)) ||
            (view.matched ? !view.matched.has(node.id) : false);
          ctx.globalAlpha = dim ? labelOpacity * 0.25 : labelOpacity;
          ctx.fillText(meta.label.slice(0, 12), node.x, node.y + radiusOf(node) + 4);
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    const loop = () => {
      const state = simRef.current;
      const dragging = state.nodes.some((n) => n.dragging);
      const active = runningRef.current && state.alpha > ALPHA_FLOOR;
      if (active) state.alpha = step(state.alpha);
      // 只在"还在动 / 正在拖 / 有变化"时重绘,静下来就不烧 CPU
      if (active || dragging || needsRedrawRef.current) {
        draw();
        needsRedrawRef.current = false;
      }
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [view, nodeById, nodeScale, linkWidth, labelOpacity, showLabels, selected]);

  // 指针交互:拖节点 / 平移画布 / 点节点看摘要
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dragNode: SimNode | null = null;
    let panning = false;
    let last = { x: 0, y: 0 };
    let moved = 0;

    const toWorld = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const pan = simRef.current.pan;
      return {
        x: event.clientX - rect.left - pan.x,
        y: event.clientY - rect.top - pan.y,
      };
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
        <button
          onClick={relayout}
          className="rounded-lg border border-border px-2.5 py-1.5 transition-colors hover:bg-foreground/5"
        >
          ↻ 重新布局
        </button>
        <span className="ml-auto opacity-50">
          {view.nodes.length} 个节点 · {view.edges.length} 条连线
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

      {/* 有节点但一条线都没有:多半是还没写过 [[链接]],直接告诉站长怎么连 */}
      {view.nodes.length > 0 && view.edges.length === 0 && (
        <p className="mt-3 rounded-lg border border-border px-3 py-2 text-xs leading-relaxed opacity-70">
          现在只有孤立的点、还没有连线。在任意一篇正文里写{" "}
          <code className="rounded bg-foreground/10 px-1 py-0.5">
            [[另一篇的标题]]
          </code>
          ,保存后回到这里,两篇之间就会连上一条线。
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

        {/* 点开节点后的摘要浮层(Obsidian 也是这种浮卡) */}
        {selected && (
          <div className="glass absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm rounded-xl p-3.5 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{selected.label}</p>
                <p className="mt-0.5 text-xs opacity-50">
                  {noteTypeLabel(selected.type)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="关闭"
                className="shrink-0 rounded-md px-1.5 text-xs opacity-50 hover:opacity-100"
              >
                ✕
              </button>
            </div>
            {selected.excerpt && (
              <p className="mt-2 line-clamp-4 text-xs leading-relaxed opacity-70">
                {selected.excerpt}
              </p>
            )}
            <Link
              href={selected.href}
              className="mt-2.5 inline-block text-xs text-accent hover:underline"
            >
              {mode === "public" ? "阅读这篇 →" : "打开原文 →"}
            </Link>
          </div>
        )}
      </div>

      <p className={`text-xs opacity-50 ${isFill ? "" : "mt-3"}`}>
        拖节点可以手动摆位置,空白处拖动是平移画布,点节点看摘要。节点越大表示连出去的线越多。
      </p>
    </div>
  );
}
