// 知识图谱(C10):从笔记正文的 [[双向链接]] 提取关系,构建节点与连线。
// MVP 布局:节点均匀分布在圆周上(SVG 渲染);后续可换力学布局。
import { listOwnNoteBasics } from "./kb-content";
import type { SiteUser } from "./users";

export type GraphNode = { id: number; label: string; type: string };
export type GraphEdge = { from: number; to: number; label: string };
export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };

export function extractWikiLinks(content: string): string[] {
  const matches = content.matchAll(/\[\[([^\]]+)\]\]/g);
  return [...matches].map((m) => m[1].trim()).filter(Boolean);
}

// 内容读取走私有区出口 kb-content(带归属过滤),这里只管把 [[链接]] 连成图
export async function buildGraph(user: SiteUser): Promise<GraphData> {
  const rows = await listOwnNoteBasics(user);

  // 标题(小写) → 节点,[[链接]] 按标题匹配
  const byTitle = new Map<string, number>();
  for (const row of rows) {
    byTitle.set(row.title.toLowerCase(), row.id);
  }

  const nodes: GraphNode[] = rows.map((row) => ({
    id: row.id,
    label: row.title,
    type: row.type,
  }));

  const seen = new Set<string>();
  const edges: GraphEdge[] = [];
  for (const row of rows) {
    for (const link of extractWikiLinks(row.content)) {
      const target = byTitle.get(link.toLowerCase());
      if (target && target !== row.id) {
        const key = `${row.id}->${target}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push({ from: row.id, to: target, label: link });
        }
      }
    }
  }

  return { nodes, edges };
}
