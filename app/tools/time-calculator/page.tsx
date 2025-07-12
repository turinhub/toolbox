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

// 快速操作预设
const quickOperations = [
  { label: "1分钟", days: 0, hours: 0, minutes: 1 },
  { label: "15分钟", days: 0, hours: 0, minutes: 15 },
  { label: "30分钟", days: 0, hours: 0, minutes: 30 },
  { label: "1小时", days: 0, hours: 1, minutes: 0 },
  { label: "2小时", days: 0, hours: 2, minutes: 0 },
  { label: "6小时", days: 0, hours: 6, minutes: 0 },
  { label: "12小时", days: 0, hours: 12, minutes: 0 },
  { label: "1天", days: 1, hours: 0, minutes: 0 },
  { label: "3天", days: 3, hours: 0, minutes: 0 },
  { label: "1周", days: 7, hours: 0, minutes: 0 },
  { label: "1个月", days: 30, hours: 0, minutes: 0 },
];

const DateCalculator = () => {
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
      toast.error("计算出错，请检查输入");
      return "计算出错";
    }
  }, [baseDate, baseTime, operation, days, hours, minutes]);

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
    if (calculatedResult && calculatedResult !== "计算出错") {
      navigator.clipboard.writeText(calculatedResult);
      toast.success("结果已复制到剪贴板");
    }
  }, [calculatedResult]);

  const handleQuickOperation = (preset: (typeof quickOperations)[0]) => {
    setDays(preset.days.toString());
    setHours(preset.hours.toString());
    setMinutes(preset.minutes.toString());
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">基准日期</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={setCurrentDateTime}
              className="text-xs"
            >
              <Clock className="mr-1 h-3 w-3" />
              当前时间
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
                <CalendarIcon className="mr-2 h-4 w-4" />
                {baseDate ? format(baseDate, "PPP") : <span>选择日期</span>}
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
        <div className="space-y-2">
          <label className="text-sm font-medium">基准时间</label>
          <Input
            type="time"
            value={baseTime}
            onChange={e => setBaseTime(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">操作类型</label>
          <div className="flex gap-2">
            <Button
              variant={operation === "add" ? "default" : "outline"}
              onClick={() => setOperation("add")}
              className="flex-1"
            >
              <Plus className="mr-2 h-4 w-4" />
              增加
            </Button>
            <Button
              variant={operation === "subtract" ? "default" : "outline"}
              onClick={() => setOperation("subtract")}
              className="flex-1"
            >
              <Minus className="mr-2 h-4 w-4" />
              减少
            </Button>
          </div>
        </div>

        {/* 快速操作按钮 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">快速操作</label>
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
          <div className="space-y-2">
            <label className="text-sm font-medium">天数</label>
            <Input
              type="number"
              value={days}
              onChange={e => setDays(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">小时</label>
            <Input
              type="number"
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="0"
              min="0"
              max="23"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">分钟</label>
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
            重置数值
          </Button>
        </div>
      </div>

      {calculatedResult && (
        <div className="relative">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                计算结果
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
      toast.error("换算出错，请检查输入");
      return "换算出错";
    }
  }, [date, time, fromTimezone, toTimezone]);

  const copyResult = useCallback(() => {
    if (convertedTime && convertedTime !== "换算出错") {
      navigator.clipboard.writeText(convertedTime);
      toast.success("结果已复制到剪贴板");
    }
  }, [convertedTime]);

  const filteredTimezones = useMemo(() => {
    if (!timezoneSearch) return timezoneList;
    return timezoneList.filter(tz =>
      tz.label.toLowerCase().includes(timezoneSearch.toLowerCase())
    );
  }, [timezoneSearch]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">日期</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={setCurrentDateTime}
              className="text-xs"
            >
              <Clock className="mr-1 h-3 w-3" />
              当前时间
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
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>选择日期</span>}
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
        <div className="space-y-2">
          <label className="text-sm font-medium">时间</label>
          <Input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
          />
        </div>
      </div>

      {/* 常用时区快速选择 */}
      <div className="space-y-2">
        <label className="text-sm font-medium">常用时区</label>
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
        <div className="space-y-2">
          <label className="text-sm font-medium">源时区</label>
          <Select value={fromTimezone} onValueChange={setFromTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索时区..."
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
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="self-end"
          onClick={handleSwap}
        >
          <ArrowLeftRight className="h-4 w-4" />
        </Button>

        <div className="space-y-2">
          <label className="text-sm font-medium">目标时区</label>
          <Select value={toTimezone} onValueChange={setToTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <div className="p-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索时区..."
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
            </SelectContent>
          </Select>
        </div>
      </div>

      {convertedTime && (
        <div className="relative">
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                转换结果
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
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">时间计算器</h1>
        <p className="text-muted-foreground">
          进行日期计算、时区换算等时间相关的操作
        </p>
      </div>

      {/* 主要功能：日期计算 */}
      <Card>
        <CardHeader>
          <CardTitle>日期计算</CardTitle>
          <CardDescription>
            对指定日期进行加减运算，支持天数、小时、分钟
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DateCalculator />
        </CardContent>
      </Card>

      {/* 时区换算功能 */}
      <Card>
        <CardHeader>
          <CardTitle>时区换算</CardTitle>
          <CardDescription>在不同的时区之间换算时间</CardDescription>
        </CardHeader>
        <CardContent>
          <TimezoneConverter />
        </CardContent>
      </Card>
    </div>
  );
}
