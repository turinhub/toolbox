"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Solar } from "lunar-javascript";

interface YearInfoCardProps {
  selectedDate: Date;
}

export default function YearInfoCard({ selectedDate }: YearInfoCardProps) {
  const y = selectedDate.getFullYear();
  const m = selectedDate.getMonth() + 1;
  const d = selectedDate.getDate();
  const lunar = Solar.fromYmd(y, m, d).getLunar();
  const summaryItems = [
    {
      label: "农历",
      value: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    },
    {
      label: "干支",
      value: `${lunar.getYearInGanZhi()}年`,
    },
    {
      label: "生肖",
      value: `${lunar.getYearShengXiao()}年`,
    },
  ];

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary/80">当前选中日期</p>
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {format(selectedDate, "M月d日", { locale: zhCN })}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {format(selectedDate, "yyyy年 EEEE", { locale: zhCN })}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {summaryItems.map(item => (
          <div
            key={item.label}
            className="min-w-[120px] rounded-2xl border border-border/60 bg-background/80 px-4 py-3 backdrop-blur"
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-sm font-medium">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
