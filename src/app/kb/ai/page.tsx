import AiSettings from "@/components/kb/AiSettings";
import { getAiConfigMasked } from "@/lib/ai";

// 桌宠 AI 配置:接口地址/Key/模型/人设,兼容一切 OpenAI 格式接口
export const dynamic = "force-dynamic";

export const metadata = { title: "AI 助手设置" };

export default async function KbAiPage() {
  const config = await getAiConfigMasked();

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI 助手(绘梨衣)</h1>
        <span className="text-xs opacity-50">🔑 Key 只存你自己的数据库,页面上永远打码</span>
      </div>
      <p className="mt-1 text-sm opacity-60">
        兼容一切 OpenAI 格式的接口(智谱 / DeepSeek / 通义 / OpenAI / 本地
        Ollama)。填好地址、Key、模型,绘梨衣就活了。
      </p>
      <div className="mt-6">
        <AiSettings initial={config} />
      </div>
    </main>
  );
}
