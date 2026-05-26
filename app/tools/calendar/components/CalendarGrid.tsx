"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="min-w-0 overflow-hidden rounded-3xl border-border/60 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">月历视图</CardTitle>
            <CardDescription>
              点击日期查看农历、节气、节日和每日宜忌
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
              今天
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1">已选日期</span>
            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-red-500">
              节日
            </span>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-blue-500">
              节气
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={cn(
                "rounded-xl bg-muted/40 py-2 text-center text-sm font-medium",
                (i === 0 || i === 6) && "text-red-500"
              )}
            >
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const selected = isSelected(day);
            const isWeekend = idx % 7 === 0 || idx % 7 === 6;

            return (
              <button
                key={idx}
                onClick={() => onSelectDate(day.date)}
                className={cn(
                  "relative flex min-h-[78px] flex-col items-start justify-between rounded-2xl border p-2 text-left transition-all sm:min-h-[92px] sm:p-3",
                  "bg-background hover:border-primary/30 hover:bg-muted/30",
                  !day.isCurrentMonth &&
                    "border-transparent bg-muted/20 text-muted-foreground",
                  selected &&
                    "border-primary/50 bg-primary/10 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]",
                  day.isToday && "border-primary/40"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm font-semibold leading-none",
                    isWeekend && !selected && !day.isToday && "text-red-500",
                    day.isToday && "bg-primary text-primary-foreground",
                    selected && !day.isToday && "bg-primary/15 text-foreground"
                  )}
                >
                  {day.day}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-[10px] leading-tight sm:text-xs",
                    day.labelType === "festival" && "font-medium text-red-500",
                    day.labelType === "jieqi" && "font-medium text-blue-500",
                    day.labelType === "month-first" &&
                      "font-medium text-primary"
                  )}
                >
                  {day.displayLabel}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
