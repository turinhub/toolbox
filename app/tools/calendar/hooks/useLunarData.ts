"use client";

import { useMemo } from "react";
import { getCalendarDays, type CalendarDay } from "../lib/lunar-utils";

export function useLunarData(year: number, month: number): CalendarDay[] {
  return useMemo(() => getCalendarDays(year, month), [year, month]);
}
