"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

interface CalendarHeaderProps {
  year: number;
  month: number;
  onNavigate: (delta: number) => void;
  onSetMonth: (year: number, month: number) => void;
  onToday: () => void;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEAR_RANGE = Array.from({ length: 201 }, (_, i) => 1900 + i);

export default function CalendarHeader({
  year,
  month,
  onNavigate,
  onSetMonth,
  onToday,
}: CalendarHeaderProps) {
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        navigation: "Month navigation",
        monthTitle: `${new Intl.DateTimeFormat("en", {
          month: "long",
          year: "numeric",
        }).format(new Date(year, month - 1, 1))}`,
        previous: "Previous month",
        next: "Next month",
        year: "{year}",
        month: "{month}",
        today: "Today",
      }
    : {
        navigation: "月份导航",
        monthTitle: `${year}年${month}月`,
        previous: "上个月",
        next: "下个月",
        year: "{year}年",
        month: "{month}月",
        today: "回到今天",
      };
  return (
    <div className="rounded-3xl border border-border/60 bg-card/90 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {copy.navigation}
            </p>
            <h2 className="text-xl font-semibold tracking-tight">
              {copy.monthTitle}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate(-1)}
              aria-label={copy.previous}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate(1)}
              aria-label={copy.next}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Select
              value={String(year)}
              onValueChange={v => onSetMonth(Number(v), month)}
            >
              <SelectTrigger className="w-full sm:w-[116px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {YEAR_RANGE.map(y => (
                    <SelectItem key={y} value={String(y)}>
                      {copy.year.replace("{year}", String(y))}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={String(month)}
              onValueChange={v => onSetMonth(year, Number(v))}
            >
              <SelectTrigger className="w-full sm:w-[96px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {MONTHS.map(m => (
                    <SelectItem key={m} value={String(m)}>
                      {copy.month.replace("{month}", String(m))}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="sm:min-w-24"
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            {copy.today}
          </Button>
        </div>
      </div>
    </div>
  );
}
