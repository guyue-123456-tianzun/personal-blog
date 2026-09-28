import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { flattenText, slugId } from "@/lib/toc";

// 标题统一补上锚点 id(目录靠它跳转),同时留出 scroll-mt,
// 免得跳过去之后标题被吸顶的导航条盖住。
// 目录侧用的是同一个 slugId,两边规则一致才不会跳空(见 lib/toc.ts)
const components = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 id={slugId(flattenText(children))} className="scroll-mt-24">
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 id={slugId(flattenText(children))} className="scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 id={slugId(flattenText(children))} className="scroll-mt-24">
      {children}
    </h3>
  ),
};

// Markdown 渲染统一入口:博客文章与知识库笔记共用(GFM 表格/任务列表 + 代码高亮 + 标题锚点)
export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
