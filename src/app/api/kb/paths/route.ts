import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import {
  addPathNode,
  createPath,
  deletePath,
  togglePathNode,
} from "@/lib/collections";

// 学习路线(B7):POST {action:...}
// create {title,description?} | add-node {pathId,title} | toggle-node {nodeId} | delete-path {pathId}
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    pathId?: number;
    nodeId?: number;
    title?: string;
    description?: string;
  } | null;
  if (!body?.action) {
    return NextResponse.json({ error: "缺少 action" }, { status: 400 });
  }
  try {
    if (body.action === "create") {
      if (!body.title) {
        return NextResponse.json({ error: "路线标题不能为空" }, { status: 400 });
      }
      const row = await createPath(user, {
        title: body.title,
        description: body.description,
      });
      return NextResponse.json({ ok: true, path: row });
    }
    if (body.action === "add-node") {
      const row = await addPathNode(Number(body.pathId), user, body.title ?? "");
      return NextResponse.json({ ok: true, node: row });
    }
    if (body.action === "toggle-node") {
      const row = await togglePathNode(Number(body.nodeId), user);
      return NextResponse.json({ ok: true, node: row });
    }
    if (body.action === "delete-path") {
      await deletePath(Number(body.pathId), user);
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
