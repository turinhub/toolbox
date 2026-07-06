"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftRight,
  Calendar as CalendarIcon,
  Plus,
  Minus,
  Clock,
  Copy,
  Search,
} from "lucide-react";
import { getTimeZones, type TimeZone } from "@vvo/tzdb";
import {
  format,
  addDays,
  addHours,
  addMinutes,
  subDays,
  subHours,
  subMinutes,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

const timezoneList = getTimeZones().map((tz: TimeZone) => ({
  value: tz.name,
  label: `${tz.name} (UTC${tz.currentTimeFormat.substring(3)})`,
}));

// 常用时区列表
const popularTimezones = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Australia/Sydney",
];

const getQuickOperations = (isEnglish: boolean) => [
  { label: isEnglish ? "1 minute" : "1分钟", days: 0, hours: 0, minutes: 1 },
  {
    label: isEnglish ? "15 minutes" : "15分钟",
    days: 0,
    hours: 0,
    minutes: 15,
  },
  {
    label: isEnglish ? "30 minutes" : "30分钟",
    days: 0,
    hours: 0,
    minutes: 30,
  },
  { label: isEnglish ? "1 hour" : "1小时", days: 0, hours: 1, minutes: 0 },
  { label: isEnglish ? "2 hours" : "2小时", days: 0, hours: 2, minutes: 0 },
  { label: isEnglish ? "6 hours" : "6小时", days: 0, hours: 6, minutes: 0 },
  { label: isEnglish ? "12 hours" : "12小时", days: 0, hours: 12, minutes: 0 },
  { label: isEnglish ? "1 day" : "1天", days: 1, hours: 0, minutes: 0 },
  { label: isEnglish ? "3 days" : "3天", days: 3, hours: 0, minutes: 0 },
  { label: isEnglish ? "1 week" : "1周", days: 7, hours: 0, minutes: 0 },
  { label: isEnglish ? "1 month" : "1个月", days: 30, hours: 0, minutes: 0 },
];

const DateCalculator = () => {
  const isEnglish = useLocale() === englishLocale;
  const quickOperations = getQuickOperations(isEnglish);
  const copy = isEnglish
    ? {
        calculationError: "Calculation failed. Check the input.",
        calculationErrorResult: "Calculation failed",
        copied: "Result copied to clipboard",
        baseDate: "Base date",
        currentTime: "Current time",
        selectDate: "Select date",
        baseTime: "Base time",
        operationType: "Operation type",
        add: "Add",
        subtract: "Subtract",
        quickOperations: "Quick operations",
        days: "Days",
        hours: "Hours",
        minutes: "Minutes",
        reset: "Reset values",
        result: "Calculation result",
      }
    : {
        calculationError: "计算出错，请检查输入",
        calculationErrorResult: "计算出错",
        copied: "结果已复制到剪贴板",
        baseDate: "基准日期",
        currentTime: "当前时间",
        selectDate: "选择日期",
        baseTime: "基准时间",
        operationType: "操作类型",
        add: "增加",
        subtract: "减少",
        quickOperations: "快速操作",
        days: "天数",
        hours: "小时",
        minutes: "分钟",
        reset: "重置数值",
        result: "计算结果",
      };
  const [baseDate, setBaseDate] = useState<Date | undefined>(new Date());
  const [baseTime, setBaseTime] = useState(format(new Date(), "HH:mm"));
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [days, setDays] = useState("0");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");

  const calculatedResult = useMemo(() => {
    if (!baseDate || !baseTime) return "";

    try {
      const [timeHours, timeMinutes] = baseTime.split(":").map(Number);
      const dateTime = new Date(baseDate);
      dateTime.setHours(timeHours, timeMinutes, 0, 0);

      const daysValue = parseInt(days) || 0;
      const hoursValue = parseInt(hours) || 0;
      const minutesValue = parseInt(minutes) || 0;

      let result = new Date(dateTime);

      if (operation === "add") {
        result = addDays(result, daysValue);
        result = addHours(result, hoursValue);
        result = addMinutes(result, minutesValue);
      } else {
        result = subDays(result, daysValue);
        result = subHours(result, hoursValue);
        result = subMinutes(result, minutesValue);
      }

      return format(result, "yyyy-MM-dd HH:mm:ss EEEE");
    } catch (error) {
      console.error("Date calculation error:", error);
      toast.error(copy.calculationError);
      return copy.calculationErrorResult;
    }
  }, [
    baseDate,
    baseTime,
    copy.calculationError,
    copy.calculationErrorResult,
    operation,
    days,
    hours,
    minutes,
  ]);

  const resetValues = () => {
    setDays("0");
    setHours("0");
    setMinutes("0");
  };

  const setCurrentDateTime = () => {
    const now = new Date();
    setBaseDate(now);
    setBaseTime(format(now, "HH:mm"));
  };

  const copyResult = useCallback(() => {
    if (calculatedResult && calculatedResult !== copy.calculationErrorResult) {
      navigator.clipboard.writeText(calculatedResult);
      toast.success(copy.copied);
    }
  }, [calculatedResult, copy.calculationErrorResult, copy.copied]);

  const handleQuickOperation = (preset: ReturnType<typeof getQuickOperations>[0]) => {
    setDays(preset.days.toString());
    setHours(preset.hours.toString());
    setMinutes(preset.minutes.toString());
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{copy.baseDate}</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={setCurrentDateTime}
              className="text-xs"
            >
              <Clock className="mr-1 h-3 w-3" />
              {copy.currentTime}
            </Button>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !baseDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon data-icon="inline-start" />
                {baseDate ? format(baseDate, "PPP") : <span>{copy.selectDate}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={baseDate}
                onSelect={setBaseDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{copy.baseTime}</label>
          <Input
            type="time"
            value={baseTime}
            onChange={e => setBaseTime(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{copy.operationType}</label>
          <div className="flex gap-2">
            <Button
              variant={operation === "add" ? "default" : "outline"}
              onClick={() => setOperation("add")}
              className="flex-1"
            >
              <Plus data-icon="inline-start" />
              {copy.add}
            </Button>
            <Button
              variant={operation === "subtract" ? "default" : "outline"}
              onClick={() => setOperation("subtract")}
              className="flex-1"
            >
              <Minus data-icon="inline-start" />
              {copy.subtract}
            </Button>
          </div>
        </div>

        {/* 快速操作按钮 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{copy.quickOperations}</label>
          <div className="flex flex-wrap gap-2">
            {quickOperations.map(preset => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickOperation(preset)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{copy.days}</label>
            <Input
              type="number"
              value={days}
              onChange={e => setDays(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{copy.hours}</label>
            <Input
              type="number"
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="0"
              min="0"
              max="23"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{copy.minutes}</label>
            <Input
              type="number"
              value={minutes}
              onChange={e => setMinutes(e.target.value)}
              placeholder="0"
              min="0"
              max="59"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button variant="outline" onClick={resetValues}>
            {copy.reset}
          </Button>
        </div>
      </div>

      {calculatedResult && (
        <div className="relative">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {copy.result}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyResult}
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="font-mono font-semibold text-lg text-blue-900 dark:text-blue-100 break-all">
              {calculatedResult}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const TimezoneConverter = () => {
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        conversionError: "Conversion failed. Check the input.",
        conversionErrorResult: "Conversion failed",
        copied: "Result copied to clipboard",
        date: "Date",
        currentTime: "Current time",
        selectDate: "Select date",
        time: "Time",
        popularTimezones: "Popular time zones",
        sourceTimezone: "Source time zone",
        targetTimezone: "Target time zone",
        searchTimezone: "Search time zones...",
        swapTimezones: "Swap time zones",
        result: "Converted result",
      }
    : {
        conversionError: "换算出错，请检查输入",
        conversionErrorResult: "换算出错",
        copied: "结果已复制到剪贴板",
        date: "日期",
        currentTime: "当前时间",
        selectDate: "选择日期",
        time: "时间",
        popularTimezones: "常用时区",
        sourceTimezone: "源时区",
        targetTimezone: "目标时区",
        searchTimezone: "搜索时区…",
        swapTimezones: "交换时区",
        result: "转换结果",
      };
  const currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [fromTimezone, setFromTimezone] = useState(currentTz);
  const [toTimezone, setToTimezone] = useState("UTC");
  const [timezoneSearch, setTimezoneSearch] = useState("");

  const handleSwap = () => {
    setFromTimezone(toTimezone);
    setToTimezone(fromTimezone);
  };

  const setCurrentDateTime = () => {
    const now = new Date();
    setDate(now);
    setTime(format(now, "HH:mm"));
  };

  const convertedTime = useMemo(() => {
    if (!date || !time) return "";
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const dateTime = new Date(date);
      dateTime.setHours(hours, minutes);

      const utcDate = fromZonedTime(dateTime, fromTimezone);
      const zonedDate = toZonedTime(utcDate, toTimezone);
      return format(zonedDate, "yyyy-MM-dd HH:mm:ss zzz");
    } catch (error) {
      console.error("Time conversion error:", error);
      toast.error(copy.conversionError);
      return copy.conversionErrorResult;
    }
  }, [
    copy.conversionError,
    copy.conversionErrorResult,
    date,
    time,
    fromTimezone,
    toTimezone,
  ]);

  const copyResult = useCallback(() => {
    if (convertedTime && convertedTime !== copy.conversionErrorResult) {
      navigator.clipboard.writeText(convertedTime);
      toast.success(copy.copied);
    }
  }, [convertedTime, copy.conversionErrorResult, copy.copied]);

  const filteredTimezones = useMemo(() => {
    if (!timezoneSearch) return timezoneList;
    return timezoneList.filter(tz =>
      tz.label.toLowerCase().includes(timezoneSearch.toLowerCase())
    );
  }, [timezoneSearch]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{copy.date}</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={setCurrentDateTime}
              className="text-xs"
            >
              <Clock className="mr-1 h-3 w-3" />
              {copy.currentTime}
            </Button>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon data-icon="inline-start" />
                {date ? format(date, "PPP") : <span>{copy.selectDate}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{copy.time}</label>
          <Input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
          />
        </div>
      </div>

      {/* 常用时区快速选择 */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">{copy.popularTimezones}</label>
        <div className="flex flex-wrap gap-2">
          {popularTimezones.map(tz => (
            <Badge
              key={tz}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => setToTimezone(tz)}
            >
              {tz}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{copy.sourceTimezone}</label>
          <Select value={fromTimezone} onValueChange={setFromTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectGroup>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={copy.searchTimezone}
                      value={timezoneSearch}
                      onChange={e => setTimezoneSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                {filteredTimezones.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="self-end"
          onClick={handleSwap}
          aria-label={copy.swapTimezones}
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">{copy.targetTimezone}</label>
          <Select value={toTimezone} onValueChange={setToTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectGroup>
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={copy.searchTimezone}
                      value={timezoneSearch}
                      onChange={e => setTimezoneSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                {filteredTimezones.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {convertedTime && (
        <div className="relative">
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {copy.result}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyResult}
                className="text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="font-mono font-semibold text-lg text-green-900 dark:text-green-100 break-all">
              {convertedTime}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function TimeCalculatorPage() {
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        dateTitle: "Date calculation",
        dateDescription:
          "Add or subtract days, hours, and minutes from a selected date.",
        timezoneTitle: "Time zone conversion",
        timezoneDescription: "Convert time between different time zones.",
      }
    : {
        dateTitle: "日期计算",
        dateDescription: "对指定日期进行加减运算，支持天数、小时、分钟",
        timezoneTitle: "时区换算",
        timezoneDescription: "在不同的时区之间换算时间",
      };
  return (
    <div className="flex flex-col gap-8">
      {/* 主要功能：日期计算 */}
      <Card>
        <CardHeader>
          <CardTitle>{copy.dateTitle}</CardTitle>
          <CardDescription>{copy.dateDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <DateCalculator />
        </CardContent>
      </Card>

      {/* 时区换算功能 */}
      <Card>
        <CardHeader>
          <CardTitle>{copy.timezoneTitle}</CardTitle>
          <CardDescription>{copy.timezoneDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <TimezoneConverter />
        </CardContent>
      </Card>
    </div>
  );
}
