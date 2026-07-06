"use client";

import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { Solar } from "lunar-javascript";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

interface YearInfoCardProps {
  selectedDate: Date;
}

export default function YearInfoCard({ selectedDate }: YearInfoCardProps) {
  const isEnglish = useLocale() === englishLocale;
  const dateLocale = isEnglish ? enUS : zhCN;
  const y = selectedDate.getFullYear();
  const m = selectedDate.getMonth() + 1;
  const d = selectedDate.getDate();
  const lunar = Solar.fromYmd(y, m, d).getLunar();
  const summaryItems = [
    {
      label: isEnglish ? "Lunar" : "农历",
      value: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    },
    {
      label: isEnglish ? "Gan-Zhi" : "干支",
      value: `${lunar.getYearInGanZhi()}${isEnglish ? "" : "年"}`,
    },
    {
      label: isEnglish ? "Zodiac" : "生肖",
      value: `${lunar.getYearShengXiao()}${isEnglish ? "" : "年"}`,
    },
  ];

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-primary/80">
          {isEnglish ? "Selected date" : "当前选中日期"}
        </p>
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {format(selectedDate, isEnglish ? "MMMM d" : "M月d日", {
              locale: dateLocale,
            })}
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            {format(selectedDate, isEnglish ? "yyyy EEEE" : "yyyy年 EEEE", {
              locale: dateLocale,
            })}
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
