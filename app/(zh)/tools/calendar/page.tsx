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
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/90 p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-32" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Skeleton className="h-10 w-full sm:w-[116px]" />
              <Skeleton className="h-10 w-full sm:w-[96px]" />
              <Skeleton className="col-span-2 h-10 w-full sm:w-24" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
          <Skeleton className="min-h-[620px] rounded-3xl" />
          <Skeleton className="h-[540px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="rounded-3xl border border-border/60 bg-card/90 p-4 shadow-sm sm:p-6">
        <YearInfoCard selectedDate={selectedDate} />
      </div>

      <CalendarHeader
        year={currentYear}
        month={currentMonth}
        onNavigate={navigateMonth}
        onSetMonth={setMonth}
        onToday={goToToday}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
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
