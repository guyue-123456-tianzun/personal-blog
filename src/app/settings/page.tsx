import AiSettings from "@/components/kb/AiSettings";
import AppearanceForm from "@/components/kb/AppearanceForm";
import TrashActions from "@/components/kb/TrashActions";
import PasswordChangeForm from "@/components/settings/PasswordChangeForm";
import { getAiConfigMasked } from "@/lib/ai";
import { listTrash } from "@/lib/kb-content";
import { getSessionUser } from "@/lib/session";
import { getAppearance } from "@/lib/settings";

// 站长设置页:全站/个人设置都归这里——外观、AI 助手、备份导出、回收站、账号安全。
// (信息架构 2026-09-29 拍板:「站长入口」升级为「设置」,知识类进 /atlas 工作台,
//  记录类进前台对应页面;/kb 旧页在过渡期保留可用)
export const dynamic = "force-dynamic";

export const metadata = { title: "设置" };

const SECTIONS = [
  { id: "appearance", label: "🎨 外观与歌单" },
  { id: "ai", label: "🤖 AI 助手" },
  { id: "export", label: "📦 备份导出" },
  { id: "trash", label: "🗑 回收站" },
  { id: "account", label: "🔐 账号安全" },
];

function SectionCard({
  id,
  title,
  desc,
  children,
}: {
  id: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="glass scroll-mt-24 rounded-2xl p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span className="inline-block h-5 w-1 rounded-full bg-accent" />
        {title}
      </h2>
      {desc && <p className="mt-1 text-sm opacity-60">{desc}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [appearance, aiConfig, trashItems] = await Promise.all([
    getAppearance(),
    getAiConfigMasked(),
    listTrash(user),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 pt-24 pb-16 sm:px-6">
      <h1 className="text-2xl font-bold">设置</h1>
      <p className="mt-1 text-sm opacity-60">
        站点外观、AI 服务、数据备份与账号安全都归这里;写作与记录在前台各页面完成。
      </p>

      {/* 锚点导航:大屏吸附在左,小屏横滑 */}
      <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-20 lg:z-30 lg:float-left lg:mr-8 lg:block lg:w-44 lg:overflow-visible">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="block whitespace-nowrap rounded-full px-3.5 py-2 text-sm opacity-70 transition-colors hover:bg-foreground/10 hover:opacity-100"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <div className="space-y-6 lg:ml-52">
        <SectionCard
          id="appearance"
          title="外观与歌单"
          desc="站点名字那一刻的第一印象:壁纸、头像、签名、公告、点歌台、恋爱卡、天气卡。"
        >
          <AppearanceForm initial={appearance} />
        </SectionCard>

        <SectionCard
          id="ai"
          title="AI 助手(绘梨衣)"
          desc="兼容一切 OpenAI 格式接口(智谱 / DeepSeek / 通义 / OpenAI / 本地 Ollama);Key 只存你自己的数据库。"
        >
          <AiSettings initial={aiConfig} />
        </SectionCard>

        <SectionCard
          id="export"
          title="备份与导出"
          desc="你的数据永远不属于任何一个平台:随时打包带走,任何笔记软件都能打开。"
        >
          <ul className="list-disc space-y-1 pl-5 text-sm leading-6 opacity-80">
            <li>posts\ —— 全部博客文章,Markdown 格式</li>
            <li>notes\ —— 全部私有笔记,Markdown 格式</li>
            <li>attachments\ —— 全部附件原文件</li>
            <li>manifest.json —— 导出时间和数量清单</li>
          </ul>
          <a
            href="/api/kb/export"
            className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            下载全部内容(.zip)
          </a>
        </SectionCard>

        <SectionCard
          id="trash"
          title="回收站"
          desc={
            trashItems.length === 0
              ? undefined
              : "删除的内容先到这里,数据仍然完整;只有「彻底删除」才会真正清掉。"
          }
        >
          {trashItems.length === 0 ? (
            <p className="text-sm opacity-60">回收站是空的。</p>
          ) : (
            <ul className="space-y-2">
              {trashItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="font-medium">{item.title}</span>
                    <span className="ml-3 rounded-full border border-border px-2 py-0.5 text-xs opacity-60">
                      {item.type === "post" ? "博客文章" : item.type}
                    </span>
                    <span className="ml-3 text-xs opacity-50">
                      删除于 {item.updatedAt.slice(0, 16)}
                    </span>
                  </span>
                  <TrashActions id={item.id} title={item.title} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard id="account" title="账号安全">
          <PasswordChangeForm username={user.username} />
        </SectionCard>
      </div>
    </main>
  );
}
