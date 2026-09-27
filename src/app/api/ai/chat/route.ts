import { NextResponse } from "next/server";

import { buildSystemPrompt, getAiConfig } from "@/lib/ai";

// 桌宠问答接口(公开):调站长配置的 OpenAI 兼容接口生成绘梨衣的回复。
// 限流:同 IP 每小时 20 次,保护站长的 API 额度。
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const recentCalls = new Map<string, number[]>();

function checkRateLimit(key: string) {
  const now = Date.now();
  const list = (recentCalls.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_LIMIT) {
    throw new Error("绘梨衣聊得太开心啦,一小时后再来找她吧~");
  }
  list.push(now);
  recentCalls.set(key, list);
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  const body = (await request.json().catch(() => null)) as {
    message?: string;
    history?: ChatMessage[];
  } | null;
  if (!body?.message?.trim()) {
    return NextResponse.json({ error: "和绘梨衣说点什么吧~" }, { status: 400 });
  }

  try {
    checkRateLimit(ip);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "请求太频繁" },
      { status: 429 },
    );
  }

  const config = await getAiConfig();
  if (!config.enabled || !config.baseUrl || !config.apiKey || !config.model) {
    return NextResponse.json(
      { error: "绘梨衣还没连上大脑:站长需要在外观后台配置 AI 服务哦~" },
      { status: 400 },
    );
  }

  // 历史只保留最近 10 条,防止提示词越滚越长
  const history = (Array.isArray(body.history) ? body.history : [])
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length <= 2000,
    )
    .slice(-10);

  const systemPrompt = await buildSystemPrompt();
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.8,
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: body.message.slice(0, 500) },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("AI 接口报错:", response.status, detail.slice(0, 300));
      return NextResponse.json(
        { error: `绘梨衣的大脑打了个喷嚏(${response.status}),稍后再试试~` },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ error: "绘梨衣走神了,再问一次吧~" }, { status: 502 });
    }
    return NextResponse.json({ reply });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      {
        error: aborted
          ? "绘梨衣想了太久,再问一次吧~"
          : "绘梨衣的大脑暂时联系不上,检查一下 AI 配置哦~",
      },
      { status: 502 },
    );
  }
}
