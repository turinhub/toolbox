"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
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
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={() => onNavigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => onNavigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={String(year)}
          onValueChange={v => onSetMonth(Number(v), month)}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_RANGE.map(y => (
              <SelectItem key={y} value={String(y)}>
                {y}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(month)}
          onValueChange={v => onSetMonth(year, Number(v))}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map(m => (
              <SelectItem key={m} value={String(m)}>
                {m}月
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" size="sm" onClick={onToday}>
        <RotateCcw className="mr-1 h-3.5 w-3.5" />
        今天
      </Button>
    </div>
  );
}
