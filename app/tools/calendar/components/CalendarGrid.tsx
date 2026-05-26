"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { CalendarDay } from "../lib/lunar-utils";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

interface CalendarGridProps {
  days: CalendarDay[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export default function CalendarGrid({
  days,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const isSelected = (day: CalendarDay) =>
    format(day.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");

  return (
    <div className="flex-1 min-w-0">
      {/* 星期标题 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={cn(
              "py-2 text-center text-sm font-medium",
              (i === 0 || i === 6) && "text-red-500"
            )}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {days.map((day, idx) => {
          const selected = isSelected(day);
          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day.date)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 min-h-[56px] sm:min-h-[64px] transition-colors bg-background hover:bg-muted/50",
                !day.isCurrentMonth && "opacity-35",
                selected && "bg-primary/10 hover:bg-primary/15"
              )}
            >
              {/* 公历日期 */}
              <span
                className={cn(
                  "text-sm font-medium leading-tight",
                  day.isToday &&
                    "flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground",
                  selected &&
                    !day.isToday &&
                    "flex items-center justify-center w-6 h-6 rounded-full bg-muted-foreground/15"
                )}
              >
                {day.day}
              </span>
              {/* 农历/节气/节日标签 */}
              <span
                className={cn(
                  "text-[10px] leading-tight mt-0.5 truncate max-w-full px-1",
                  day.labelType === "festival" && "text-red-500 font-medium",
                  day.labelType === "jieqi" && "text-blue-500 font-medium",
                  day.labelType === "month-first" && "text-primary font-medium"
                )}
              >
                {day.displayLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
