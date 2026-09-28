"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AiConfig } from "@/lib/ai";

type Props = { initial: AiConfig };

// 桌宠 AI 配置表单:兼容一切 OpenAI 格式接口;key 脱敏显示,留空即沿用旧 key
export default function AiSettings({ initial }: Props) {
  const router = useRouter();
  const [config, setConfig] = useState<AiConfig>(initial);
  const [keyInput, setKeyInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function save() {
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/kb/ai", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_enabled: config.enabled ? "1" : "0",
          ai_base_url: config.baseUrl,
          ai_api_key: keyInput,
          ai_model: config.model,
          ai_persona: config.persona,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        config?: AiConfig;
      };
      setStatus(res.ok ? "已保存 ✓" : (data.error ?? "保存失败"));
      if (res.ok && data.config) {
        setKeyInput("");
        setConfig(data.config);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

  const presets = [
    { name: "智谱 GLM", url: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash" },
    { name: "DeepSeek", url: "https://api.deepseek.com", model: "deepseek-chat" },
    { name: "OpenAI", url: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-border p-4">
        <div>
          <p className="text-sm font-semibold">桌宠开关</p>
          <p className="mt-0.5 text-xs opacity-50">关闭后前台不再显示绘梨衣与聊天入口</p>
        </div>
        <button
          onClick={() => setConfig({ ...config, enabled: !config.enabled })}
          className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
            config.enabled ? "bg-accent text-white" : "border border-border opacity-70"
          }`}
        >
          {config.enabled ? "已开启" : "已关闭"}
        </button>
      </div>

      <div className="glass space-y-4 rounded-2xl p-5">
        <div>
          <label className="text-sm font-semibold">接口地址(Base URL)</label>
          <input
            value={config.baseUrl}
            onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            placeholder="https://open.bigmodel.cn/api/paas/v4"
            className={`${inputClass} mt-1.5`}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() =>
                  setConfig({ ...config, baseUrl: preset.url, model: preset.model })
                }
                className="rounded-full border border-border px-2.5 py-1 text-xs transition-colors hover:bg-foreground/10"
              >
                {preset.name}
              </button>
            ))}
            <span className="self-center text-xs opacity-50">点一下填常用配置,再填自己的 key 即可</span>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">API Key</label>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={config.apiKey ? `已配置(${config.apiKey}),留空 = 沿用` : "尚未配置,粘贴你的 key"}
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div>
          <label className="text-sm font-semibold">模型名称</label>
          <input
            value={config.model}
            onChange={(e) => setConfig({ ...config, model: e.target.value })}
            placeholder="如 glm-4-flash / deepseek-chat / gpt-4o-mini"
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div>
          <label className="text-sm font-semibold">绘梨衣的人设(系统提示词)</label>
          <textarea
            value={config.persona}
            onChange={(e) => setConfig({ ...config, persona: e.target.value })}
            rows={6}
            className={`${inputClass} mt-1.5 resize-none font-mono text-xs`}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          {status && <span className="text-xs opacity-70">{status}</span>}
          <button
            onClick={save}
            disabled={busy}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "保存中…" : "保存配置"}
          </button>
        </div>
      </div>
    </div>
  );
}
