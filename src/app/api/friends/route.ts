import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import {
  acceptRequest,
  getRelationStatus,
  removeFriendship,
  sendFriendRequest,
} from "@/lib/friends";
import { getUserByUsername } from "@/lib/users";

// 好友操作统一入口:POST { action, ... }
// action: send(加好友,需 targetUsername) | accept/reject(处理申请,需 requestId) | remove(删除关系,需 requestId)
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: string;
    targetUsername?: string;
    requestId?: number;
  } | null;
  if (!body?.action) {
    return NextResponse.json({ error: "缺少 action" }, { status: 400 });
  }

  try {
    if (body.action === "send") {
      if (!body.targetUsername) {
        return NextResponse.json({ error: "缺少目标用户" }, { status: 400 });
      }
      const target = await getUserByUsername(body.targetUsername);
      if (!target) {
        return NextResponse.json({ error: "用户不存在" }, { status: 404 });
      }
      await sendFriendRequest(user.id, target.id);
      return NextResponse.json({ ok: true, status: "pending_out" });
    }

    if (body.action === "accept" || body.action === "reject") {
      if (!body.requestId) {
        return NextResponse.json({ error: "缺少 requestId" }, { status: 400 });
      }
      if (body.action === "accept") {
        await acceptRequest(body.requestId, user.id);
      } else {
        await removeFriendship(body.requestId, user.id);
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === "remove") {
      if (!body.requestId) {
        return NextResponse.json({ error: "缺少 requestId" }, { status: 400 });
      }
      await removeFriendship(body.requestId, user.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "操作失败" },
      { status: 400 },
    );
  }
}

// 查询与某用户的关系(朋友圈卡片渲染用)
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const targetUsername = new URL(request.url).searchParams.get("username");
  if (!targetUsername) {
    return NextResponse.json({ error: "缺少 username" }, { status: 400 });
  }
  const target = await getUserByUsername(targetUsername);
  if (!target) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }
  return NextResponse.json(await getRelationStatus(user.id, target.id));
}
