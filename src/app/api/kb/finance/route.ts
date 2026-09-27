import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { addFinanceRecord, deleteFinance } from "@/lib/collections";

// 记账(C9):POST {action:add|delete, ...}
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    id?: number;
    kind?: string;
    amount?: number;
    category?: string;
    note?: string;
    date?: string;
  } | null;
  if (!body?.action) {
    return NextResponse.json({ error: "缺少 action" }, { status: 400 });
  }
  try {
    if (body.action === "add") {
      const row = await addFinanceRecord(user, {
        kind: (body.kind as "income" | "expense") ?? "expense",
        amount: Number(body.amount),
        category: body.category,
        note: body.note,
        date: body.date,
      });
      return NextResponse.json({ ok: true, record: row });
    }
    if (body.action === "delete") {
      await deleteFinance(Number(body.id), user);
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
