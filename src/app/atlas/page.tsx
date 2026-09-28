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
    // 外层挂 dark:工作台是一块"深空控制台",不跟随站点的深浅色——
    // 星系背景必须是暗的,挂在 .dark 上之后里面所有玻璃卡片、边框会自动用深色那套变量。
    // 注意还必须显式写 text-foreground:变量在子树上被覆盖了,但 color 早在 body 上
    // 就按浅色算好并继承下来了,不重新取一次的话文字会是深色、压在深空上看不见
    // -mt-14 把深色背景顶到页面最上沿(根布局给内容留了 56px 让位悬浮导航,
    // 不抵消掉的话浅色模式下导航后面会露出一条白带);内部 pt 再把内容推回导航下方
    <div className="dark atlas-app relative -mt-14 min-h-screen bg-[#05060f] pt-[76px] text-foreground">
      <div className="relative">
        <AtlasWorkspace
          notes={notes}
          graph={graph}
          aiEnabled={Boolean(ai.enabled && ai.baseUrl && ai.apiKey && ai.model)}
          userName={user.nickname ?? user.username}
        />
      </div>
    </div>
  );
}
