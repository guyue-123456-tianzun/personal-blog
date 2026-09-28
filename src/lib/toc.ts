// 文章目录(TOC)的提取与锚点 id 生成。
// 目录和正文标题必须用**同一套** id 规则,否则点了跳不过去——所以两边都调用这里的 slugId。
//
// 为什么不用"第几个标题"来编号:那样要求渲染顺序与解析顺序完全一致,
// React 重复渲染时容易错位。改成"只由标题文字决定 id"的纯函数,简单且稳。
// 代价:同名的两个标题会拿到同一个 id,目录会都指向第一个——个人博客里极少见,可以接受。
import type { ReactNode } from "react";

export type TocItem = { level: number; text: string; id: string };

/** 标题文字 → 锚点 id(只用文字,不依赖顺序) */
export function slugId(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `h-${base || "section"}`;
}

/** 把 React 子节点摊平成纯文字(标题里可能嵌着 <code> 之类) */
export function flattenText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  const el = node as { props?: { children?: ReactNode } };
  return el.props ? flattenText(el.props.children) : "";
}

/**
 * 从 Markdown 原文里抽出标题,生成目录。
 * 只取 1~3 级(和正文渲染时加锚点的级别保持一致),并跳过代码块里的 # 注释。
 */
export function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const text = match[2].replace(/#+\s*$/, "").trim();
    if (!text) continue;
    items.push({ level: match[1].length, text, id: slugId(text) });
  }
  return items;
}
