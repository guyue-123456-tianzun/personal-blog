"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

export type LifeHabit = { id: number; name: string; streak: number; checkedToday: boolean };
export type LifeFinance = {
  id: number;
  kind: string;
  amount: number; // 分
  category: string | null;
  note: string | null;
  date: string;
};
export type LifeEvent = { id: number; date: string; title: string; content: string | null };
// 日记 = 生活记录(2026-09-29 站长拍板:写日记归生活,不归知识库)
// preview = 正文摘要(服务端取数时截 80 字),列表里只展示摘要不整篇铺开
export type LifeDiary = {
  id: number;
  title: string;
  preview: string;
  updatedAt: string;
};

type Props = {
  habits: LifeHabit[];
  finance: LifeFinance[];
  timeline: LifeEvent[];
  diary: LifeDiary[];
};

const inputClass =
  "rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-accent";

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="flex items-center gap-2.5 text-lg font-bold">
        <span className="inline-block h-5 w-1 rounded-full bg-accent" />
        {title}
      </h2>
      <p className="mt-1 text-sm opacity-60">{desc}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const todayStr = () => new Date().toISOString().slice(0, 10);

// 生活页交互面板:习惯打卡 / 快捷记一笔 / 成长时间线,全部只操作登录用户自己的数据
export default function LifeClient({ habits, finance, timeline, diary }: Props) {
  const router = useRouter();
  const [hint, setHint] = useState("");
  const [newHabit, setNewHabit] = useState("");
  const [kind, setKind] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [diaryText, setDiaryText] = useState("");
  const [eventDate, setEventDate] = useState(todayStr());
  const [eventTitle, setEventTitle] = useState("");
  const [eventContent, setEventContent] = useState("");

  // 组件级防抖:同一时刻只放行一个请求
  const busyRef = useRef({ busy: false });

  // 本月收支:记账以"分"存,展示换算成元
  const monthly = useMemo(() => {
    const month = todayStr().slice(0, 7);
    let income = 0;
    let expense = 0;
    for (const r of finance) {
      if (!r.date.startsWith(month)) continue;
      if (r.kind === "income") income += r.amount;
      else expense += r.amount;
    }
    return { income, expense };
  }, [finance]);

  async function call(url: string, body: unknown, okHint: string) {
    if (busyRef.current.busy) return;
    busyRef.current.busy = true;
    setHint("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({})) as { error?: string });
      if (!res.ok) {
        setHint(data.error ?? "操作失败");
        return;
      }
      setHint(okHint);
      router.refresh();
    } finally {
      busyRef.current.busy = false;
    }
  }

  return (
    <div className="space-y-6">
      {hint && (
        <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-2 text-sm">
          {hint}
        </p>
      )}

      {/* ===== 习惯打卡 ===== */}
      <Card title="习惯打卡" desc="每天勾一下,连续天数看着就有劲儿。">
        <div className="space-y-2">
          {habits.length === 0 && (
            <p className="text-sm opacity-55">还没有习惯,先加一个。</p>
          )}
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="min-w-0">
                <span className="font-medium">{habit.name}</span>
                <span className="ml-3 text-xs opacity-55">
                  连续 {habit.streak} 天
                </span>
              </span>
              <button
                onClick={() =>
                  call(
                    "/api/kb/habits",
                    { action: "toggle-today", habitId: habit.id },
                    habit.checkedToday ? "已取消今日打卡" : "今日已打卡 ✓",
                  )
                }
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
                  habit.checkedToday
                    ? "bg-accent text-white"
                    : "border border-border hover:bg-foreground/10"
                }`}
              >
                {habit.checkedToday ? "✓ 今日已打" : "打卡"}
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <input
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="新习惯,比如「睡前不刷手机」"
              className={`${inputClass} flex-1`}
            />
            <button
              onClick={() => {
                if (!newHabit.trim()) return;
                void call("/api/kb/habits", { action: "add-habit", name: newHabit.trim() }, "已添加习惯 ✓");
                setNewHabit("");
              }}
              className="rounded-full bg-accent px-5 py-2 text-sm text-white transition-opacity hover:opacity-90"
            >
              添加
            </button>
          </div>
        </div>
      </Card>

      {/* ===== 日记(2026-09-29 站长拍板:写作类的日记归生活,不归知识库) ===== */}
      <Card title="日记" desc="今天过得怎么样,随手写下几笔;只有你自己能看到。">
        <textarea
          value={diaryText}
          onChange={(e) => setDiaryText(e.target.value)}
          placeholder="今天…(想到什么写什么,Markdown 也行)"
          rows={4}
          className={`${inputClass} w-full resize-y leading-6`}
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => {
              if (!diaryText.trim()) {
                setHint("写点什么再存");
                return;
              }
              void call(
                "/api/kb/notes",
                {
                  type: "diary",
                  title: `日记 ${todayStr()}`,
                  content: diaryText.trim(),
                  isPublic: 0,
                },
                "日记已保存 ✓",
              );
              setDiaryText("");
            }}
            disabled={busyRef.current.busy}
            className="rounded-full bg-accent px-5 py-2 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            存日记
          </button>
          <span className="text-xs opacity-50">同一天再写会另存一条,历史都在下面。</span>
        </div>
        {diary.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {diary.slice(0, 5).map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <span className="opacity-55">{entry.updatedAt.slice(0, 10)}</span>{" "}
                <span className="opacity-80">
                  {entry.preview || "(空)"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ===== 记账 ===== */}
      <Card title="记账" desc="随手记一笔,月底看去向。数据只有你自己可见。">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-border px-3 py-1">
            本月收入 <b className="text-accent">{(monthly.income / 100).toFixed(2)}</b> 元
          </span>
          <span className="rounded-full border border-border px-3 py-1">
            本月支出 <b className="text-accent">{(monthly.expense / 100).toFixed(2)}</b> 元
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={inputClass}
            aria-label="收或支"
          >
            <option value="expense">支出</option>
            <option value="income">收入</option>
          </select>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="金额(元)"
            inputMode="decimal"
            className={inputClass}
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="分类(如 餐饮)"
            className={inputClass}
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="备注(可空)"
            className={inputClass}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              const yuan = Number(amount);
              if (!Number.isFinite(yuan) || yuan <= 0) {
                setHint("先填个金额");
                return;
              }
              void call(
                "/api/kb/finance",
                {
                  action: "add",
                  kind,
                  amount: yuan,
                  category: category.trim() || undefined,
                  note: note.trim() || undefined,
                  date: todayStr(),
                },
                "已记一笔 ✓",
              );
              setAmount("");
              setCategory("");
              setNote("");
            }}
            className="rounded-full bg-accent px-5 py-2 text-sm text-white transition-opacity hover:opacity-90"
          >
            记一笔
          </button>
        </div>
        {finance.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {finance.slice(0, 5).map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  <span className="opacity-55">{r.date}</span>{" "}
                  {r.category ?? (r.kind === "income" ? "收入" : "支出")}
                  {r.note && <span className="opacity-55"> · {r.note}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={r.kind === "income" ? "text-emerald-500" : ""}>
                    {r.kind === "income" ? "+" : "-"}
                    {(r.amount / 100).toFixed(2)}
                  </span>
                  <button
                    onClick={() =>
                      call("/api/kb/finance", { action: "delete", id: r.id }, "已删除")
                    }
                    aria-label="删除这条记录"
                    className="text-xs opacity-40 transition-opacity hover:opacity-100"
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ===== 成长时间线 ===== */}
      <Card title="成长时间线" desc="记下那些值得回头看的节点。">
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={inputClass}
          />
          <input
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="事件标题"
            className={inputClass}
          />
          <input
            value={eventContent}
            onChange={(e) => setEventContent(e.target.value)}
            placeholder="一句话(可空)"
            className={inputClass}
          />
        </div>
        <button
          onClick={() => {
            if (!eventTitle.trim()) {
              setHint("给节点起个名字");
              return;
            }
            void call(
              "/api/kb/timeline",
              {
                action: "add",
                date: eventDate,
                title: eventTitle.trim(),
                content: eventContent.trim() || undefined,
              },
              "已记录节点 ✓",
            );
            setEventTitle("");
            setEventContent("");
          }}
          className="mt-2 rounded-full bg-accent px-5 py-2 text-sm text-white transition-opacity hover:opacity-90"
        >
          记录节点
        </button>
        {timeline.length > 0 && (
          <ul className="mt-4 space-y-3 border-l border-border pl-4">
            {timeline.slice(0, 8).map((ev) => (
              <li key={ev.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      <span className="mr-2 opacity-55">{ev.date}</span>
                      {ev.title}
                    </p>
                    {ev.content && (
                      <p className="mt-0.5 text-sm opacity-65">{ev.content}</p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      call("/api/kb/timeline", { action: "delete", id: ev.id }, "已删除")
                    }
                    aria-label="删除这个节点"
                    className="shrink-0 text-xs opacity-40 transition-opacity hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

