"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useCalendarState } from "./hooks/useCalendarState";
import { useLunarData } from "./hooks/useLunarData";
import CalendarHeader from "./components/CalendarHeader";
import CalendarGrid from "./components/CalendarGrid";
import DateDetailPanel from "./components/DateDetailPanel";
import YearInfoCard from "./components/YearInfoCard";

export default function CalendarPage() {
  const {
    isHydrated,
    currentYear,
    currentMonth,
    selectedDate,
    navigateMonth,
    setMonth,
    goToToday,
    selectDate,
  } = useCalendarState();

  const calendarDays = useLunarData(currentYear, currentMonth);

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">万年历</h1>
          <p className="text-muted-foreground">
            支持农历、二十四节气、传统节日、干支纪年与每日宜忌查询
          </p>
        </div>

        <div className="flex justify-center">
          <Skeleton className="h-6 w-48" />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-10 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-10 w-[80px]" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="min-h-[420px] flex-1 rounded-lg" />
          <Skeleton className="h-[420px] w-full md:w-[340px] shrink-0 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">万年历</h1>
        <p className="text-muted-foreground">
          支持农历、二十四节气、传统节日、干支纪年与每日宜忌查询
        </p>
      </div>

      <YearInfoCard selectedDate={selectedDate} />

      <CalendarHeader
        year={currentYear}
        month={currentMonth}
        onNavigate={navigateMonth}
        onSetMonth={setMonth}
        onToday={goToToday}
      />

      <div className="flex flex-col md:flex-row gap-6">
        <CalendarGrid
          days={calendarDays}
          selectedDate={selectedDate}
          onSelectDate={date => {
            selectDate(date);
          }}
        />
        <DateDetailPanel selectedDate={selectedDate} days={calendarDays} />
      </div>
    </div>
  );
}
