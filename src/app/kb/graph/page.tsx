import Link from "next/link";

import KnowledgeGraph from "@/components/graph/KnowledgeGraph";
import { buildGraph } from "@/lib/graph";
import { getSessionUser } from "@/lib/session";

// 知识图谱(C10):笔记间 [[双向链接]] 的关系图。
// 交互(拖动/筛选/点开看摘要)在 KnowledgeGraph 组件里,这里只管取数与外壳
export const dynamic = "force-dynamic";

export const metadata = { title: "知识图谱" };

export default async function KbGraphPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  const graph = await buildGraph(sessionUser);

  return (
    <main className="px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">知识图谱</h1>
        <Link href="/network" className="text-sm text-accent hover:underline">
          → 看访客视角的知识网络
        </Link>
      </div>
      <p className="mt-1 text-sm opacity-60">
        你全部内容之间的关系图:共 {graph.nodes.length} 个节点、
        {graph.edges.length} 条连线。在任意一篇正文里写 [[另一篇的标题]] 就能连上。
      </p>

      <div className="mt-5">
        <KnowledgeGraph data={graph} mode="private" />
      </div>
    </main>
  );
}
