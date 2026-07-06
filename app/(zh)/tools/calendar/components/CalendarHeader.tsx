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
  return (
    <div className="rounded-3xl border border-border/60 bg-card/90 p-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              月份导航
            </p>
            <h2 className="text-xl font-semibold tracking-tight">
              {year}年{month}月
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate(-1)}
              aria-label="上个月"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate(1)}
              aria-label="下个月"
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
                      {y}年
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
                      {m}月
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
            回到今天
          </Button>
        </div>
      </div>
    </div>
  );
}
