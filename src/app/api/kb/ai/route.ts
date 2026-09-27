import { NextResponse } from "next/server";

import { getSessionUsername } from "@/lib/session";
import { getAiConfigMasked, saveAiConfig } from "@/lib/ai";

// 桌宠 AI 配置:GET 返回脱敏配置(key 打码),PATCH 保存。
// PATCH 时 api_key 传空/传掩码 = 保持原 key 不变,防止把真 key 冲掉。
export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  return NextResponse.json(await getAiConfigMasked());
}

export async function PATCH(request: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    ai_enabled?: string;
    ai_base_url?: string;
    ai_api_key?: string;
    ai_model?: string;
    ai_persona?: string;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const values: Record<string, string> = {};
  if (body.ai_enabled !== undefined) {
    values.ai_enabled = body.ai_enabled === "1" ? "1" : "0";
  }
  if (body.ai_base_url !== undefined) {
    values.ai_base_url = body.ai_base_url.trim().slice(0, 300);
  }
  // 只有填了新 key 才覆盖;空值/掩码 = 沿用旧 key
  if (
    body.ai_api_key !== undefined &&
    body.ai_api_key.trim() &&
    !body.ai_api_key.includes("****")
  ) {
    values.ai_api_key = body.ai_api_key.trim();
  }
  if (body.ai_model !== undefined) {
    values.ai_model = body.ai_model.trim().slice(0, 100);
  }
  if (body.ai_persona !== undefined) {
    values.ai_persona = body.ai_persona.slice(0, 2000);
  }

  await saveAiConfig(values);
  return NextResponse.json({ ok: true, config: await getAiConfigMasked() });
}
