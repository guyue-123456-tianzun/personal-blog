// 知识图谱(C10):从笔记正文的 [[双向链接]] 提取关系,构建节点与连线。
// 内容读取走内容出口(公开区 content-api / 私有区 kb-content),这里只负责"连成图"。
import { listOwnNoteBasics } from "./kb-content";
import { listPublishedPostBodies } from "./content-api";
import type { SiteUser } from "./users";

export type GraphNode = {
  id: number;
  label: string;
  type: string;
  /** 点开节点时"打开原文"用 */
  href: string;
  /** 点开节点时面板里显示的正文摘要 */
  excerpt: string;
};

export type GraphEdge = { from: number; to: number; label: string };
export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };

export function extractWikiLinks(content: string): string[] {
  const matches = content.matchAll(/\[\[([^\]]+)\]\]/g);
  return [...matches].map((m) => m[1].trim()).filter(Boolean);
}

/** 正文摘要:去掉标题行与多余空行,截前若干字给面板预览 */
function excerptOf(content: string) {
  return content
    .replace(/^#+\s.*$/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

/** 把"标题 → 节点"的列表连成图:[[标题]] 命中就加一条线 */
function link(
  rows: { id: number; title: string; type: string; content: string; href: string }[],
): GraphData {
  const byTitle = new Map<string, number>();
  for (const row of rows) byTitle.set(row.title.trim().toLowerCase(), row.id);

  const nodes: GraphNode[] = rows.map((row) => ({
    id: row.id,
    label: row.title,
    type: row.type,
    href: row.href,
    excerpt: excerptOf(row.content),
  }));

  const seen = new Set<string>();
  const edges: GraphEdge[] = [];
  for (const row of rows) {
    for (const wiki of extractWikiLinks(row.content)) {
      const target = byTitle.get(wiki.toLowerCase());
      // 自己连自己、重复连线都跳过;指向不存在的笔记也不凭空造节点
      if (!target || target === row.id) continue;
      const key = `${row.id}->${target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: row.id, to: target, label: wiki });
    }
  }
  return { nodes, edges };
}

/** 私有区图谱:当前用户自己全部内容之间的关系 */
export async function buildGraph(user: SiteUser): Promise<GraphData> {
  const rows = await listOwnNoteBasics(user);
  return link(
    rows.map((row) => ({
      ...row,
      href: row.type === "post" ? `/posts/${row.slug}` : `/kb/notes/${row.id}`,
    })),
  );
}

/** 公开图谱:只连已发布的公开文章(访客看得见的"知识网络") */
export async function buildPublicGraph(): Promise<GraphData> {
  const rows = await listPublishedPostBodies();
  return link(
    rows.map((row) => ({ ...row, href: `/posts/${row.slug}` })),
  );
}
