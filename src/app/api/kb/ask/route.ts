import { NextResponse } from "next/server";

import { getAiConfig } from "@/lib/ai";
import { getSessionUser } from "@/lib/session";

// 知识库问答(私有,参考 Khoj 的思路):
// 工作台把"和问题最相关的几篇笔记"连同问题一起发过来,这里拼好提示词去问站长配置的
// 大模型,并要求它标注引用来源。
//
// 为什么检索放在前端做:工作台本身已经握着整个知识库(几十篇的量级),在浏览器里
// 按标题/标签/正文打分排序是零延迟的,省一次往返;服务端只负责"拼提示词 + 调模型",
// 并对上下文长度做硬限制,不管前端传什么都不至于把上下文撑爆。
const MAX_SOURCES = 8;
const MAX_SOURCE_CHARS = 1500;
const MAX_QUESTION_CHARS = 500;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    question?: string;
    sources?: { title?: string; content?: string }[];
  } | null;

  const question = body?.question?.trim().slice(0, MAX_QUESTION_CHARS);
  if (!question) {
    return NextResponse.json({ error: "先写个问题" }, { status: 400 });
  }

  const config = await getAiConfig();
  if (!config.enabled || !config.baseUrl || !config.apiKey || !config.model) {
    return NextResponse.json(
      { error: "还没配置 AI 服务,去 外观设置 → AI 助手 里填一下接口地址和 Key" },
      { status: 400 },
    );
  }

  // 上下文:只取前几篇,每篇截断,避免提示词失控
  const sources = (Array.isArray(body?.sources) ? body.sources : [])
    .slice(0, MAX_SOURCES)
    .map((source) => ({
      title: String(source?.title ?? "").slice(0, 120),
      content: String(source?.content ?? "").slice(0, MAX_SOURCE_CHARS),
    }))
    .filter((source) => source.title);

  const context = sources
    .map(
      (source, index) =>
        `【资料${index + 1}】${source.title}\n${source.content}`,
    )
    .join("\n\n");

  const systemPrompt = `你是这个个人知识库的检索助手。只依据下面提供的资料回答问题。
规则:
1. 资料里没有的信息,直接说"知识库里没有相关内容",不要编造。
2. 回答里凡是引用了某篇资料,用 [资料1] 这样的编号标注来源。
3. 用中文,简洁,条理清楚(需要分点时用短列表)。
4. 资料之间若有矛盾,指出来。

${context ? `资料如下:\n\n${context}` : "（这次没有任何资料,请如实说明。）"}`;

  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.3,
        max_tokens: 900,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("知识库问答报错:", response.status, detail.slice(0, 300));
      return NextResponse.json(
        { error: `AI 接口返回 ${response.status},检查一下配置` },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return NextResponse.json({ error: "模型没给出回答,再试一次" }, { status: 502 });
    }
    return NextResponse.json({ answer });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      { error: aborted ? "模型想太久超时了,再试一次" : "连不上 AI 服务,检查配置" },
      { status: 502 },
    );
  }
}
