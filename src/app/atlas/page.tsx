import AtlasWorkspace from "@/components/atlas/AtlasWorkspace";
import { getAiConfigMasked } from "@/lib/ai";
import { buildGraph } from "@/lib/graph";
import { listOwnNotesWithTags } from "@/lib/kb-content";
import { getSessionUser } from "@/lib/session";

// 知识库工作台:独立成一页的应用式界面。
// 路由守卫在 middleware 里(和 /kb 一样要登录);这里把整个知识库一次性交给前端,
// 所以切换笔记、检索、看图都是零延迟,不用来回请求。
export const dynamic = "force-dynamic";

export const metadata = { title: "知识库工作台" };

export default async function AtlasPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [rows, graph, ai] = await Promise.all([
    listOwnNotesWithTags(user),
    buildGraph(user),
    getAiConfigMasked(),
  ]);

  // 只把界面要用的字段传下去,别把整行数据(含 userId 之类)塞进页面负载
  const notes = rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    content: row.content,
    excerpt: row.excerpt,
    tags: row.tags,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isPublic: row.isPublic,
  }));

  return (
    <div className="atlas-app bg-background">
      <AtlasWorkspace
        notes={notes}
        graph={graph}
        aiEnabled={Boolean(ai.enabled && ai.baseUrl && ai.apiKey && ai.model)}
        userName={user.nickname ?? user.username}
      />
    </div>
  );
}
