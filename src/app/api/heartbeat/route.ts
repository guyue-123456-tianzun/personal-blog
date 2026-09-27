import { NextResponse } from "next/server";

import { recordHeartbeat } from "@/lib/site-stats";

// 心跳上报:公开接口,按来源 IP 记录"最近在线";统计口径见 site-stats.ts
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  recordHeartbeat(ip);
  return NextResponse.json({ ok: true });
}
