type Props = {
  /** 本月每日浏览量(日历热力格用):date = YYYY-MM-DD */
  monthViews?: { date: string; views: number }[];
};

// 浏览量分 4 档上色:0 = 暗,越高越亮(参考站热力格同款观感)
function heatClass(views: number) {
  if (views <= 0) return "bg-foreground/5";
  if (views <= 2) return "bg-accent/25";
  if (views <= 5) return "bg-accent/50";
  return "bg-accent";
}

// 日历小部件:服务端算好当月格子,今天高亮;下方一行浏览热力格
export default function CalendarWidget({ monthViews = [] }: Props) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const firstWeekday = new Date(year, month, 1).getDay(); // 0=周日
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  const viewsByDay = new Map(monthViews.map((v) => [Number(v.date.slice(8, 10)), v.views]));

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

      {/* 浏览热力格:一格 = 一天的站点访问,颜色越亮当天浏览越多 */}
      <div className="mt-3 border-t border-border pt-3">
        <p className="text-xs opacity-50">本月访问热力</p>
        <div className="mt-1.5 grid grid-cols-[repeat(14,minmax(0,1fr))] gap-[3px]">
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const views = viewsByDay.get(day) ?? 0;
            return (
              <span
                key={day}
                title={`${month + 1} 月 ${day} 日 · ${views} 次访问`}
                className={`aspect-square rounded-[3px] ${heatClass(views)}`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
