// 日历小部件:服务端算好当月格子,今天高亮
export default function CalendarWidget() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const firstWeekday = new Date(year, month, 1).getDay(); // 0=周日
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <span className="inline-block h-4 w-1 rounded-full bg-accent" />
        {year} 年 {month + 1} 月
      </h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weekdays.map((day) => (
          <span key={day} className="py-1 opacity-50">
            {day}
          </span>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === today;
          return (
            <span
              key={day}
              className={
                isToday
                  ? "rounded-full bg-accent py-1 font-bold text-white"
                  : "py-1 opacity-75"
              }
            >
              {day}
            </span>
          );
        })}
      </div>
    </section>
  );
}
