"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Record_ = {
  id: number;
  kind: string;
  amount: number;
  category: string | null;
  note: string | null;
  date: string;
};

type Props = {
  initial: Record_[];
  monthIncome: number;
  monthExpense: number;
};

// 记账管理(C9):添加收支记录 + 本月汇总 + 删除。金额以元输入、分存储。
export default function FinanceManager({ initial, monthIncome, monthExpense }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [kind, setKind] = useState<string>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/kb/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          kind,
          amount: Number(amount),
          category,
          note,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        record?: Record_;
      };
      if (!res.ok || !data.record) {
        setError(data.error ?? "添加失败");
        return;
      }
      setItems((list) => [data.record!, ...list]);
      setAmount("");
      setNote("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    setBusy(true);
    try {
      await fetch("/api/kb/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      setItems((list) => list.filter((it) => it.id !== id));
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="glass rounded-2xl p-4">
          <p className="text-2xl font-bold text-emerald-500">
            +{(monthIncome / 100).toFixed(2)}
          </p>
          <p className="mt-0.5 text-xs opacity-60">本月收入(元)</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-2xl font-bold text-red-400">
            -{(monthExpense / 100).toFixed(2)}
          </p>
          <p className="mt-0.5 text-xs opacity-60">本月支出(元)</p>
        </div>
      </div>

      <form onSubmit={add} className="glass space-y-3 rounded-2xl p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={inputClass}
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="金额(元)"
            required
            className={inputClass}
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="分类(如 餐饮)"
            className={inputClass}
          />
        </div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="备注(可空)"
          className={inputClass}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "保存中…" : "记一笔"}
        </button>
      </form>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 text-sm"
          >
            <span className="min-w-0">
              <span
                className={`mr-2 font-medium ${
                  item.kind === "income" ? "text-emerald-500" : "text-red-400"
                }`}
              >
                {item.kind === "income" ? "+" : "-"}
                {(item.amount / 100).toFixed(2)}
              </span>
              <span className="opacity-70">{item.category ?? item.note ?? ""}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3 text-xs opacity-50">
              {item.date}
              <button
                onClick={() => remove(item.id)}
                className="text-red-500 hover:underline"
              >
                删除
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
