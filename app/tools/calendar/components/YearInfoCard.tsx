"use client";

import { Badge } from "@/components/ui/badge";
import { Solar } from "lunar-javascript";

interface YearInfoCardProps {
  selectedDate: Date;
}

export default function YearInfoCard({ selectedDate }: YearInfoCardProps) {
  const y = selectedDate.getFullYear();
  const m = selectedDate.getMonth() + 1;
  const d = selectedDate.getDate();
  const lunar = Solar.fromYmd(y, m, d).getLunar();

  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <span className="font-medium">{y}年</span>
      <Badge variant="secondary">{lunar.getYearInGanZhi()}年</Badge>
      <Badge variant="outline">{lunar.getYearShengXiao()}年</Badge>
    </div>
  );
}
