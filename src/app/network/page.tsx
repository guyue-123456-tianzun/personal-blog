import KnowledgeGraph from "@/components/graph/KnowledgeGraph";
import PublicShell from "@/components/public/PublicShell";
import { buildPublicGraph } from "@/lib/graph";

// 知识网络(公开):只展示已发布文章之间的 [[互相引用]]。
// 私有笔记不进来——它走的是公开区出口,拿不到非公开内容
export const dynamic = "force-dynamic";

export const metadata = { title: "知识网络" };

export default async function NetworkPage() {
  const graph = await buildPublicGraph();

  return (
    <PublicShell>
      <div className="glass rounded-2xl p-6">
        <h1 className="text-xl font-bold">知识网络</h1>
        <p className="mt-1 text-sm opacity-60">
          已发布文章之间的引用关系:文章里写到 [[另一篇的标题]],两篇就会连上线。
          共 {graph.nodes.length} 篇、{graph.edges.length} 条连线。
        </p>
      </div>
      <div className="mt-4">
        <KnowledgeGraph data={graph} mode="public" />
      </div>
    </PublicShell>
  );
}
