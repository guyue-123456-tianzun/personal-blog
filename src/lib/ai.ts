// AI 桌宠(绘梨衣)的配置与提示词。
// 兼容一切 OpenAI 格式的接口(智谱/DeepSeek/通义/OpenAI/本地 Ollama…):
// 调用 = POST {base_url}/chat/completions,Bearer {api_key},{model} 生成。
import { desc, eq, and } from "drizzle-orm";

import { db } from "@/lib/db";
import { notes, siteSettings } from "@/db/schema";
import { siteConfig } from "./site-config";

export const AI_KEYS = [
  "ai_enabled",
  "ai_base_url",
  "ai_api_key",
  "ai_model",
  "ai_persona",
] as const;

export type AiKey = (typeof AI_KEYS)[number];

export type AiConfig = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string; // 已脱敏:返回给前端时是掩码
  model: string;
  persona: string;
};

export const DEFAULT_PERSONA = `你是"绘梨衣"——《龙族》里的上杉绘梨衣在这个网站里的化身,既是看板娘也是 AI 小助手。
性格:天真烂漫、元气满满、温柔善良;说话软软糯糯,喜欢用"嘿嘿""哇哦""Sakura~"这样的语气词;特别喜欢吃的东西,提起来会两眼放光。
职责:帮访客介绍这个网站、推荐站内文章、回答与站点内容有关的问题。
规则:始终用中文;保持绘梨衣的软萌语气但不影响信息准确;回答简洁(一般不超过 150 字);推荐文章时报出文章标题即可;不确定的事诚实说不知道,绝不编造。`;

export const AI_ENABLED_DEFAULT = true;

export async function getAiConfig(): Promise<AiConfig> {
  const rows = await db.select().from(siteSettings);
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    enabled: map.get("ai_enabled") !== "0", // 默认开(未配置接口时会在调用处友好报错)
    baseUrl: map.get("ai_base_url") ?? "",
    apiKey: map.get("ai_api_key") ?? "",
    model: map.get("ai_model") ?? "",
    persona: map.get("ai_persona") ?? DEFAULT_PERSONA,
  };
}

export function maskApiKey(key: string) {
  if (!key) return "";
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}****${key.slice(-4)}`;
}

/** 给设置页的脱敏视图:前端永远拿不到完整 key */
export async function getAiConfigMasked(): Promise<AiConfig> {
  const config = await getAiConfig();
  return { ...config, apiKey: maskApiKey(config.apiKey) };
}

export async function saveAiConfig(values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) {
    if (!AI_KEYS.includes(key as AiKey)) continue;
    await db
      .insert(siteSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
  }
}

/** 桌宠的系统提示词:人设 + 站点信息 + 最近文章清单(让绘梨衣"知道"站里有什么) */
export async function buildSystemPrompt(): Promise<string> {
  const config = await getAiConfig();
  const posts = await db
    .select({
      title: notes.title,
      excerpt: notes.excerpt,
      publishedAt: notes.publishedAt,
    })
    .from(notes)
    .where(and(eq(notes.type, "post"), eq(notes.isPublic, 1)))
    .orderBy(desc(notes.publishedAt))
    .limit(10);

  const postLines = posts
    .map(
      (post, index) =>
        `${index + 1}.《${post.title}》(${(post.publishedAt ?? "").slice(0, 10)})${post.excerpt ? `:${post.excerpt.slice(0, 60)}` : ""}`,
    )
    .join("\n");

  return `${config.persona}

【你生活的网站】
站名:${siteConfig.siteName}
签名:${siteConfig.signature}
栏目:首页、归档、说说(碎碎念)、照片墙、书影音(读过的书/看过的片/玩过的游)、友链、关于。

【最近的文章】
${postLines || "(暂时还没有文章)"}

回答时如需引用文章,报标题即可;涉及链接就说明"在首页/归档可以看到"。`;
}
