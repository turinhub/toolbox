import {
  startOfMonth,
  startOfWeek,
  addDays,
  isSameMonth,
  isToday,
} from "date-fns";
import { Solar } from "lunar-javascript";

export interface LunarDayInfo {
  yearInChinese: string;
  monthInChinese: string;
  dayInChinese: string;
  isLeapMonth: boolean;
  jieQi: string;
  lunarFestivals: string[];
  solarFestivals: string[];
  otherFestivals: string[];
  yearShengXiao: string;
  yearInGanZhi: string;
  monthInGanZhi: string;
  dayInGanZhi: string;
  dayYi: string[];
  dayJi: string[];
  dayJiShen: string[];
  dayXiongSha: string[];
  chong: string;
  sha: string;
  dayNaYin: string;
  xingZuo: string;
  pengZuGan: string;
  pengZuZhi: string;
}

export interface CalendarDay {
  date: Date;
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  lunar: LunarDayInfo;
  /** 日历格中优先显示的标签（节气/节日/农历月首） */
  displayLabel: string;
  /** 标签类型：用于颜色区分 */
  labelType: "jieqi" | "festival" | "month-first" | "normal";
}

function getLunarInfo(year: number, month: number, day: number): LunarDayInfo {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();

  return {
    yearInChinese: lunar.getYearInChinese(),
    monthInChinese: lunar.getMonthInChinese(),
    dayInChinese: lunar.getDayInChinese(),
    isLeapMonth: lunar.getMonth() < 0,
    jieQi: lunar.getJieQi(),
    lunarFestivals: lunar.getFestivals(),
    solarFestivals: solar.getFestivals(),
    otherFestivals: [
      ...lunar.getOtherFestivals(),
      ...solar.getOtherFestivals(),
    ],
    yearShengXiao: lunar.getYearShengXiao(),
    yearInGanZhi: lunar.getYearInGanZhi(),
    monthInGanZhi: lunar.getMonthInGanZhi(),
    dayInGanZhi: lunar.getDayInGanZhi(),
    dayYi: lunar.getDayYi(),
    dayJi: lunar.getDayJi(),
    dayJiShen: lunar.getDayJiShen(),
    dayXiongSha: lunar.getDayXiongSha(),
    chong: lunar.getChong(),
    sha: lunar.getSha(),
    dayNaYin: lunar.getDayNaYin(),
    xingZuo: solar.getXingZuo(),
    pengZuGan: lunar.getPengZuGan(),
    pengZuZhi: lunar.getPengZuZhi(),
  };
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstOfMonth = startOfMonth(new Date(year, month - 1));
  const startDate = startOfWeek(firstOfMonth, { weekStartsOn: 0 });

  const days: CalendarDay[] = [];

  for (let i = 0; i < 42; i++) {
    const date = addDays(startDate, i);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const lunar = getLunarInfo(y, m, d);

    // 计算显示标签及类型
    let displayLabel: string;
    let labelType: CalendarDay["labelType"] = "normal";

    const allFestivals = [
      ...lunar.lunarFestivals,
      ...lunar.solarFestivals,
      ...lunar.otherFestivals,
    ];

    if (allFestivals.length > 0) {
      displayLabel = allFestivals[0];
      labelType = "festival";
    } else if (lunar.jieQi) {
      displayLabel = lunar.jieQi;
      labelType = "jieqi";
    } else if (lunar.dayInChinese === "初一") {
      displayLabel =
        (lunar.isLeapMonth ? "闰" : "") + lunar.monthInChinese + "月";
      labelType = "month-first";
    } else {
      displayLabel = lunar.dayInChinese;
      labelType = "normal";
    }

    days.push({
      date,
      year: y,
      month: m,
      day: d,
      isCurrentMonth: isSameMonth(date, firstOfMonth),
      isToday: isToday(date),
      lunar,
      displayLabel,
      labelType,
    });
  }

  return days;
}
