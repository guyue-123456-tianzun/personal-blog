// 倒数卡(参考站同款):自动算今天之后最近的公历节日,大数字倒数。
// 当天就是节日时显示"今天是 X"。
const HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: "元旦" },
  { month: 2, day: 14, name: "情人节" },
  { month: 5, day: 1, name: "劳动节" },
  { month: 6, day: 1, name: "儿童节" },
  { month: 10, day: 1, name: "国庆节" },
  { month: 12, day: 25, name: "圣诞节" },
];

export default function CountdownCard() {
  const now = new Date();
  const year = now.getFullYear();

  // 从今天起往后找最近的节日(今年下半年找完就找明年的),最多翻一年
  // 起点 = 今天零点(以前写成今年1月1日,offset=0 恰好命中元旦,永远显示今天是元旦)
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  for (let offset = 0; offset <= 366; offset++) {
    const d = new Date(start);
    d.setDate(d.getDate() + offset);
    const hit = HOLIDAYS.find((h) => h.month === d.getMonth() + 1 && h.day === d.getDate());
    if (!hit) continue;

    const isToday = offset === 0;
    return (
      <section className="glass rounded-2xl p-5 text-center">
        <h3 className="mb-2 flex items-center justify-center gap-2 font-semibold">
          <span className="inline-block h-4 w-1 rounded-full bg-accent" />
          {isToday ? `今天是${hit.name}` : `距离${hit.name}`}
        </h3>
        <p className={`font-bold ${isToday ? "text-xl opacity-80" : "text-4xl text-accent"}`}>
          {isToday ? "🎉" : offset}
        </p>
        {!isToday && (
          <p className="mt-0.5 text-xs opacity-55">天 · {d.getMonth() + 1} 月 {d.getDate()} 日</p>
        )}
      </section>
    );
  }
  return null;
}
