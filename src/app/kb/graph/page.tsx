import Link from "next/link";

import { buildGraph } from "@/lib/graph";
import { getSessionUser } from "@/lib/session";

// 知识图谱(C10):笔记间 [[双向链接]] 的可视化(圆周布局 MVP)。
// 后续可升级力学布局(d3-force)。
export const dynamic = "force-dynamic";

export const metadata = { title: "知识图谱" };

export default async function KbGraphPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const graph = await buildGraph(sessionUser);
  const size = 560;
  const center = size / 2;
  const radius = size / 2 - 70;

  const positions = new Map<number, { x: number; y: number }>();
  graph.nodes.forEach((node, index) => {
    const angle = (index / Math.max(1, graph.nodes.length)) * Math.PI * 2 - Math.PI / 2;
    positions.set(node.id, {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold">知识图谱</h1>
      <p className="mt-1 text-sm opacity-60">
        笔记间 [[双向链接]] 的关系图,共 {graph.nodes.length} 个节点、
        {graph.edges.length} 条连线。在笔记正文里写 [[其他笔记标题]] 即可建立连接。
      </p>

      {graph.nodes.length === 0 ? (
        <p className="glass mt-6 rounded-2xl p-6 text-sm opacity-60">
          还没有内容。先在笔记里用 [[标题]] 引用其他笔记,再来这里看关系图。
        </p>
      ) : (
        <div className="glass mt-6 rounded-2xl p-4">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full">
            {graph.edges.map((edge, index) => {
              const from = positions.get(edge.from);
              const to = positions.get(edge.to);
              if (!from || !to) return null;
              return (
                <line
                  key={index}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="var(--border)"
                  strokeWidth="1.5"
                />
              );
            })}
            {graph.nodes.map((node) => {
              const pos = positions.get(node.id)!;
              return (
                <g key={node.id}>
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={node.type === "post" ? 26 : 20}
                    fill={node.type === "post" ? "var(--accent)" : "var(--card)"}
                    stroke="var(--border)"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 5}
                    textAnchor="middle"
                    fontSize="11"
                    fill={
                      node.type === "post"
                        ? "#fff"
                        : "var(--foreground)"
                    }
                  >
                    {node.label.slice(0, 6)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      <p className="mt-4 text-xs opacity-50">
        提示:节点上的文字是笔记标题前 6 个字,鼠标悬停看完整连线;笔记类型不同,圆的颜色不同。
      </p>
      <Link href="/kb" className="mt-4 inline-block text-sm text-accent hover:underline">
        ← 回仪表盘
      </Link>
    </main>
  );
}
