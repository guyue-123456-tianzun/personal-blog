"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Habit = {
  id: number;
  name: string;
  streak: number;
  checkedToday: boolean;
};

// 习惯打卡管理(C3):添加习惯、今天打卡/取消、连续天数、删除
export default function HabitManager({ initial }: { initial: Habit[] }) {
  const router = useRouter();
  const [habits, setHabits] = useState(initial);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/kb/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add-habit", name }),
      });
      if (res.ok) {
        setName("");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggleToday(habitId: number) {
    setBusy(true);
    try {
      await fetch("/api/kb/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-today", habitId }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(habitId: number) {
    if (!window.confirm("删除这个习惯(打卡记录一并删除)?")) return;
    setBusy(true);
    try {
      await fetch("/api/kb/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-habit", habitId }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="glass flex gap-2 rounded-2xl p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="新习惯,如:每天读书 30 分钟"
          className="min-w-0 flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          onClick={add}
          disabled={busy}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          添加
        </button>
      </div>

      {habits.length === 0 ? (
        <p className="opacity-60">还没有习惯。</p>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{habit.name}</p>
                <p className="mt-0.5 text-xs opacity-50">
                  {habit.checkedToday ? "今天已打卡 ✓" : "今天还没打卡"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs text-accent">
                  🔥 连续 {habit.streak} 天
                </span>
                <button
                  onClick={() => toggleToday(habit.id)}
                  disabled={busy}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {habit.checkedToday ? "取消打卡" : "打卡"}
                </button>
                <button
                  onClick={() => remove(habit.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
