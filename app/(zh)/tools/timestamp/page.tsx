"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, RefreshCw } from "lucide-react";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

export default function TimestampPage() {
  const locale = useLocale();
  const isEnglish = locale === englishLocale;
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const copy = isEnglish
    ? {
        copied: "Copied to clipboard",
        currentTitle: "Current timestamp",
        refreshCurrent: "Refresh current timestamp",
        currentDescription:
          "Show the current Unix timestamp in seconds and milliseconds.",
        seconds: "Seconds timestamp",
        milliseconds: "Milliseconds timestamp",
        copySeconds: "Copy seconds timestamp",
        copyMilliseconds: "Copy milliseconds timestamp",
        timestampToDateTitle: "Timestamp to date and time",
        timestampToDateDescription:
          "Convert a Unix timestamp into a readable date and time.",
        timestamp: "Timestamp",
        timestampPlaceholder: "Enter a timestamp in seconds or milliseconds",
        convert: "Convert",
        invalidTimestamp: "Enter a valid timestamp.",
        copyDateTime: "Copy converted date and time",
        dateToTimestampTitle: "Date and time to timestamp",
        dateToTimestampDescription:
          "Convert a date and time into Unix timestamps.",
        dateTime: "Date and time",
        convertedSeconds: "Seconds timestamp",
        convertedMilliseconds: "Milliseconds timestamp",
        copyConvertedSeconds: "Copy converted seconds timestamp",
        copyConvertedMilliseconds: "Copy converted milliseconds timestamp",
        dateConversionError: "Date conversion error:",
      }
    : {
        copied: "已复制到剪贴板",
        currentTitle: "当前时间戳",
        refreshCurrent: "刷新当前时间戳",
        currentDescription: "显示当前的 Unix 时间戳（秒和毫秒）",
        seconds: "秒级时间戳",
        milliseconds: "毫秒级时间戳",
        copySeconds: "复制秒级时间戳",
        copyMilliseconds: "复制毫秒级时间戳",
        timestampToDateTitle: "时间戳转日期时间",
        timestampToDateDescription: "将 Unix 时间戳转换为可读的日期时间格式",
        timestamp: "时间戳",
        timestampPlaceholder: "输入时间戳（秒或毫秒）",
        convert: "转换",
        invalidTimestamp: "请输入有效的时间戳",
        copyDateTime: "复制转换后的日期时间",
        dateToTimestampTitle: "日期时间转时间戳",
        dateToTimestampDescription: "将日期时间转换为 Unix 时间戳",
        dateTime: "日期时间",
        convertedSeconds: "秒级时间戳",
        convertedMilliseconds: "毫秒级时间戳",
        copyConvertedSeconds: "复制转换后的秒级时间戳",
        copyConvertedMilliseconds: "复制转换后的毫秒级时间戳",
        dateConversionError: "日期转换错误:",
      };
  // 当前时间戳状态
  const [currentTimestamp, setCurrentTimestamp] = useState({
    seconds: 0,
    milliseconds: 0,
  });

  // 时间戳转换状态
  const [timestampToConvert, setTimestampToConvert] = useState("");
  const [convertedDate, setConvertedDate] = useState("");
  const [isValidTimestamp, setIsValidTimestamp] = useState(true);

  // 日期转时间戳状态
  const [dateToConvert, setDateToConvert] = useState("");
  const [convertedTimestamp, setConvertedTimestamp] = useState({
    seconds: "",
    milliseconds: "",
  });

  // 更新当前时间戳
  const updateCurrentTimestamp = () => {
    const now = new Date();
    setCurrentTimestamp({
      seconds: Math.floor(now.getTime() / 1000),
      milliseconds: now.getTime(),
    });
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(copy.copied);
  };

  // 时间戳转日期
  const convertTimestampToDate = () => {
    try {
      const timestamp = parseInt(timestampToConvert);
      if (isNaN(timestamp)) {
        setIsValidTimestamp(false);
        setConvertedDate("");
        return;
      }

      setIsValidTimestamp(true);
      const date = new Date(
        timestamp.toString().length > 10 ? timestamp : timestamp * 1000
      );

      // 格式化日期时间
      const formattedDate = dateTimeFormatter.format(date);

      setConvertedDate(formattedDate);
    } catch {
      setIsValidTimestamp(false);
      setConvertedDate("");
    }
  };

  // 将日期转换为时间戳
  const convertDateToTimestamp = useCallback(() => {
    if (!dateToConvert) return;

    try {
      const date = new Date(dateToConvert);
      if (isNaN(date.getTime())) {
        setConvertedTimestamp({ seconds: "", milliseconds: "" });
        return;
      }

      setConvertedTimestamp({
        seconds: Math.floor(date.getTime() / 1000).toString(),
        milliseconds: date.getTime().toString(),
      });
    } catch (error) {
      console.error(copy.dateConversionError, error);
      setConvertedTimestamp({ seconds: "", milliseconds: "" });
    }
  }, [copy.dateConversionError, dateToConvert]);

  // 初始化和定时更新当前时间戳
  useEffect(() => {
    updateCurrentTimestamp();
    const interval = setInterval(updateCurrentTimestamp, 1000);

    // 设置默认的日期时间为当前时间
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    setDateToConvert(`${year}-${month}-${day}T${hours}:${minutes}`);

    return () => clearInterval(interval);
  }, []);

  // 当日期输入变化时自动转换
  useEffect(() => {
    if (dateToConvert) {
      convertDateToTimestamp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateToConvert]);

  return (
    <div className="flex flex-col gap-8">
      {/* 当前时间戳 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {copy.currentTitle}
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6"
              onClick={updateCurrentTimestamp}
              aria-label={copy.refreshCurrent}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </CardTitle>
          <CardDescription>{copy.currentDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-seconds">{copy.seconds}</Label>
              <div className="flex">
                <Input
                  id="current-seconds"
                  value={currentTimestamp.seconds}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={() =>
                    copyToClipboard(currentTimestamp.seconds.toString())
                  }
                  aria-label={copy.copySeconds}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-milliseconds">{copy.milliseconds}</Label>
              <div className="flex">
                <Input
                  id="current-milliseconds"
                  value={currentTimestamp.milliseconds}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={() =>
                    copyToClipboard(currentTimestamp.milliseconds.toString())
                  }
                  aria-label={copy.copyMilliseconds}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 时间戳转日期 */}
      <Card>
        <CardHeader>
          <CardTitle>{copy.timestampToDateTitle}</CardTitle>
          <CardDescription>{copy.timestampToDateDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <Label htmlFor="timestamp-input">{copy.timestamp}</Label>
            <div className="flex gap-2">
              <Input
                id="timestamp-input"
                name="timestamp"
                inputMode="numeric"
                autoComplete="off"
                placeholder={copy.timestampPlaceholder}
                value={timestampToConvert}
                onChange={e => setTimestampToConvert(e.target.value)}
                className={`font-mono ${!isValidTimestamp ? "border-destructive" : ""}`}
              />
              <Button onClick={convertTimestampToDate}>{copy.convert}</Button>
            </div>
            {!isValidTimestamp && (
              <p className="text-destructive text-sm">
                {copy.invalidTimestamp}
              </p>
            )}
            {convertedDate && (
              <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                <span className="font-medium">{convertedDate}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(convertedDate)}
                  aria-label={copy.copyDateTime}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 日期转时间戳 */}
      <Card>
        <CardHeader>
          <CardTitle>{copy.dateToTimestampTitle}</CardTitle>
          <CardDescription>{copy.dateToTimestampDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <Label htmlFor="datetime-input">{copy.dateTime}</Label>
            <Input
              id="datetime-input"
              name="datetime"
              type="datetime-local"
              autoComplete="off"
              value={dateToConvert}
              onChange={e => setDateToConvert(e.target.value)}
            />

            {convertedTimestamp.seconds && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {copy.convertedSeconds}
                    </div>
                    <span className="font-mono">
                      {convertedTimestamp.seconds}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(convertedTimestamp.seconds)}
                    aria-label={copy.copyConvertedSeconds}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      {copy.convertedMilliseconds}
                    </div>
                    <span className="font-mono">
                      {convertedTimestamp.milliseconds}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(convertedTimestamp.milliseconds)
                    }
                    aria-label={copy.copyConvertedMilliseconds}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
