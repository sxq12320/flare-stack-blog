import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { recentPostsQuery } from "@/features/posts/queries";

export function HeatmapSkeleton() {
  return (
    <div className="fuwari-card-base p-4">
      <Skeleton className="h-5 w-24 mb-3" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

interface DayCell {
  date: Date;
  dateStr: string;
  count: number;
  postTitles: string[];
  firstSlug?: string;
  level: 0 | 1 | 2 | 3;
  isToday: boolean;
  isFuture: boolean;
}

const MONTH_NAMES = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

export function Heatmap() {
  // Pull up to 100 recent published posts for the heatmap
  const { data: posts } = useQuery(recentPostsQuery(100));
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCell, setActiveCell] = useState<DayCell | null>(null);

  // Group published posts by YYYY-MM-DD
  const { postsMap, totalCount } = useMemo(() => {
    const map = new Map<
      string,
      { count: number; titles: string[]; firstSlug?: string }
    >();
    let total = 0;

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    for (const p of posts ?? []) {
      if (!p.publishedAt) continue;
      const d = new Date(p.publishedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const entry = map.get(key) ?? {
        count: 0,
        titles: [],
        firstSlug: p.slug,
      };
      entry.count += 1;
      entry.titles.push(p.title);
      map.set(key, entry);

      if (d >= oneYearAgo) {
        total += 1;
      }
    }
    return { postsMap: map, totalCount: total };
  }, [posts]);

  // Generate 52 weeks matrix (7 days per column, Sunday = 0 to Saturday = 6)
  const { columns, monthHeaders } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // End at the upcoming Saturday (or today if Saturday)
    const end = new Date(today);
    const dayOfWeek = end.getDay(); // 0 is Sunday, 6 is Saturday
    end.setDate(end.getDate() + (6 - dayOfWeek));

    // 52 weeks back starting from Sunday
    const start = new Date(end);
    start.setDate(start.getDate() - 52 * 7 + 1);

    const cols: DayCell[][] = [];
    const months: { colIndex: number; name: string }[] = [];
    let lastMonth = -1;

    const current = new Date(start);
    let colIndex = 0;

    while (current <= end) {
      const col: DayCell[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(current);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const entry = postsMap.get(dateStr);
        const count = entry?.count ?? 0;

        let level: 0 | 1 | 2 | 3 = 0;
        if (count >= 3) level = 3;
        else if (count === 2) level = 2;
        else if (count === 1) level = 1;

        const isToday = d.getTime() === today.getTime();
        const isFuture = d > today;

        col.push({
          date: d,
          dateStr,
          count,
          postTitles: entry?.titles ?? [],
          firstSlug: entry?.firstSlug,
          level,
          isToday,
          isFuture,
        });

        // Track month label on the first day of month
        const m = d.getMonth();
        if (m !== lastMonth && (d.getDate() <= 7 || i === 0)) {
          months.push({ colIndex, name: MONTH_NAMES[m] });
          lastMonth = m;
        }

        current.setDate(current.getDate() + 1);
      }
      cols.push(col);
      colIndex++;
    }

    return { columns: cols, monthHeaders: months };
  }, [postsMap]);

  // Scroll to the rightmost (most recent) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [columns]);

  return (
    <div className="fuwari-card-base p-4 transition-all duration-300">
      {/* Title */}
      <div className="flex items-center justify-between font-bold text-lg fuwari-text-90 relative ml-6 mt-1 mb-3">
        <span
          className="absolute -left-4 top-[5.5px] w-1 h-4 rounded-md"
          style={{ backgroundColor: "var(--fuwari-primary)" }}
        />
        <div className="flex items-center gap-1.5">
          <Flame size={18} className="text-(--fuwari-primary)" />
          <span>创作足迹</span>
        </div>
        <span className="text-xs font-normal fuwari-text-50 pr-2">
          近一年 {totalCount} 篇
        </span>
      </div>

      {/* Heatmap Grid with horizontal scrolling */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="overflow-x-auto pb-2 scroll-smooth select-none"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--fuwari-primary) transparent",
          }}
        >
          <div className="inline-flex flex-col gap-1 min-w-max pr-1">
            {/* Months Header */}
            <div className="flex text-[10px] fuwari-text-50 h-4 pl-4 relative">
              {monthHeaders.map((m, idx) => (
                <span
                  key={idx}
                  style={{
                    position: "absolute",
                    left: `${m.colIndex * 13 + 16}px`,
                  }}
                  className="whitespace-nowrap"
                >
                  {m.name}
                </span>
              ))}
            </div>

            {/* Grid Days */}
            <div className="flex gap-[3px] items-center">
              {/* Weekday indicators (Sun to Sat) */}
              <div className="flex flex-col gap-[3px] text-[9px] fuwari-text-50 pr-1 select-none">
                <span className="h-[10px] leading-[10px] opacity-0">日</span>
                <span className="h-[10px] leading-[10px]">一</span>
                <span className="h-[10px] leading-[10px] opacity-0">二</span>
                <span className="h-[10px] leading-[10px]">三</span>
                <span className="h-[10px] leading-[10px] opacity-0">四</span>
                <span className="h-[10px] leading-[10px]">五</span>
                <span className="h-[10px] leading-[10px] opacity-0">六</span>
              </div>

              {/* 52 Columns */}
              {columns.map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-[3px]">
                  {col.map((day) => {
                    const bgClass = day.isFuture
                      ? "bg-transparent opacity-10 border border-black/5 dark:border-white/5"
                      : day.level === 3
                        ? "bg-(--fuwari-primary)"
                        : day.level === 2
                          ? "bg-(--fuwari-primary)/65"
                          : day.level === 1
                            ? "bg-(--fuwari-primary)/35"
                            : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20";

                    return (
                      <div
                        key={day.dateStr}
                        className={`w-[10px] h-[10px] rounded-[2px] cursor-pointer transition-all duration-150 ${bgClass} ${
                          day.isToday
                            ? "ring-1 ring-(--fuwari-primary) ring-offset-1 ring-offset-background"
                            : ""
                        }`}
                        onMouseEnter={() => setActiveCell(day)}
                        onClick={() => {
                          if (day.firstSlug) {
                            navigate({
                              to: "/post/$slug",
                              params: { slug: day.firstSlug },
                            });
                          }
                        }}
                        title={
                          day.count > 0
                            ? `${day.dateStr} · 发表了 ${day.count} 篇\n${day.postTitles.map((t) => `• ${t}`).join("\n")}`
                            : `${day.dateStr} · 暂无动态`
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating or bottom info about hovered date */}
      <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] fuwari-text-50">
        <div className="truncate max-w-[170px]">
          {activeCell ? (
            activeCell.count > 0 ? (
              <span className="text-(--fuwari-primary) font-medium">
                {activeCell.dateStr} · {activeCell.count} 篇
              </span>
            ) : (
              <span>{activeCell.dateStr} · 无发文</span>
            )
          ) : (
            <span>滑动或悬停查看足迹</span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 shrink-0">
          <span>少</span>
          <span className="w-2 h-2 rounded-[1px] bg-black/5 dark:bg-white/10 inline-block" />
          <span className="w-2 h-2 rounded-[1px] bg-(--fuwari-primary)/35 inline-block" />
          <span className="w-2 h-2 rounded-[1px] bg-(--fuwari-primary)/65 inline-block" />
          <span className="w-2 h-2 rounded-[1px] bg-(--fuwari-primary) inline-block" />
          <span>多</span>
        </div>
      </div>
    </div>
  );
}
