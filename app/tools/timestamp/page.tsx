"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, RefreshCw } from "lucide-react";

export default function TimestampPage() {
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
    toast.success("已复制到剪贴板");
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
      const formattedDate = date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      
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
      console.error("日期转换错误:", error);
      setConvertedTimestamp({ seconds: "", milliseconds: "" });
    }
  }, [dateToConvert]);

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
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">时间戳转换工具</h1>
        <p className="text-muted-foreground">
          获取当前时间戳，在时间戳和日期时间之间进行转换
        </p>
      </div>

      {/* 当前时间戳 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            当前时间戳
            <Button 
              variant="outline" 
              size="icon" 
              className="h-6 w-6" 
              onClick={updateCurrentTimestamp}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </CardTitle>
          <CardDescription>显示当前的Unix时间戳（秒和毫秒）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">秒级时间戳</div>
              <div className="flex">
                <Input 
                  value={currentTimestamp.seconds} 
                  readOnly 
                  className="font-mono"
                />
                <Button 
                  variant="outline" 
                  className="ml-2" 
                  onClick={() => copyToClipboard(currentTimestamp.seconds.toString())}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">毫秒级时间戳</div>
              <div className="flex">
                <Input 
                  value={currentTimestamp.milliseconds} 
                  readOnly 
                  className="font-mono"
                />
                <Button 
                  variant="outline" 
                  className="ml-2" 
                  onClick={() => copyToClipboard(currentTimestamp.milliseconds.toString())}
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
          <CardTitle>时间戳转日期时间</CardTitle>
          <CardDescription>将Unix时间戳转换为可读的日期时间格式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="输入时间戳（秒或毫秒）"
                value={timestampToConvert}
                onChange={(e) => setTimestampToConvert(e.target.value)}
                className={`font-mono ${!isValidTimestamp ? "border-destructive" : ""}`}
              />
              <Button onClick={convertTimestampToDate}>转换</Button>
            </div>
            {!isValidTimestamp && (
              <p className="text-destructive text-sm">请输入有效的时间戳</p>
            )}
            {convertedDate && (
              <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                <span className="font-medium">{convertedDate}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(convertedDate)}
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
          <CardTitle>日期时间转时间戳</CardTitle>
          <CardDescription>将日期时间转换为Unix时间戳</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4">
            <Input
              type="datetime-local"
              value={dateToConvert}
              onChange={(e) => setDateToConvert(e.target.value)}
            />
            
            {convertedTimestamp.seconds && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">秒级时间戳</div>
                    <span className="font-mono">{convertedTimestamp.seconds}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(convertedTimestamp.seconds)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">毫秒级时间戳</div>
                    <span className="font-mono">{convertedTimestamp.milliseconds}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(convertedTimestamp.milliseconds)}
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