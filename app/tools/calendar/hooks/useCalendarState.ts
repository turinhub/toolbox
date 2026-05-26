"use client";

import { useState, useCallback, useEffect } from "react";

const INITIAL_DATE = new Date(2000, 0, 1);

export function useCalendarState() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentYear, setCurrentYear] = useState(INITIAL_DATE.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(INITIAL_DATE.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<Date>(INITIAL_DATE);

  useEffect(() => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDate(today);
    setIsHydrated(true);
  }, []);

  const navigateMonth = useCallback((delta: number) => {
    setCurrentMonth(prev => {
      let m = prev + delta;
      let yAdjust = 0;
      if (m < 1) {
        m = 12;
        yAdjust = -1;
      } else if (m > 12) {
        m = 1;
        yAdjust = 1;
      }
      setCurrentYear(y => {
        const newY = y + yAdjust;
        // 翻月时同步 selectedDate 到新月份的 1 号
        setSelectedDate(new Date(newY, m - 1, 1));
        return newY;
      });
      return m;
    });
  }, []);

  const setMonth = useCallback((year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    setSelectedDate(new Date(year, month - 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDate(today);
  }, []);

  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  return {
    isHydrated,
    currentYear,
    currentMonth,
    selectedDate,
    navigateMonth,
    setMonth,
    goToToday,
    selectDate,
  };
}
