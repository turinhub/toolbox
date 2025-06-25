"use client";

import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  time: number;
  size: number;
}

interface ApiResponseDisplayProps {
  response: ApiResponse | null;
  isLoading: boolean;
}

export default function ApiResponseDisplay({
  response,
  isLoading,
}: ApiResponseDisplayProps) {
  // 获取状态码颜色
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-500";
    if (status >= 300 && status < 400) return "text-blue-500";
    if (status >= 400 && status < 500) return "text-yellow-500";
    if (status >= 500) return "text-red-500";
    return "text-gray-500";
  };

  // 格式化 JSON 数据
  const formatJson = (data: unknown) => {
    try {
      if (typeof data === "string") {
        try {
          // 尝试解析 JSON 字符串
          const parsed = JSON.parse(data);
          return JSON.stringify(parsed, null, 2);
        } catch {
          // 如果不是有效的 JSON，直接返回原始字符串
          return data;
        }
      }
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>响应结果</CardTitle>
        <CardDescription>API 请求的响应状态、头信息和数据</CardDescription>
      </CardHeader>
      <CardContent>
        {response ? (
          <div className="space-y-4">
            {/* 响应状态 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span
                  className={`text-2xl font-bold ${getStatusColor(response.status)}`}
                >
                  {response.status}
                </span>
                <span className="text-muted-foreground">
                  {response.statusText}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {response.time}ms · {(response.size / 1024).toFixed(2)} KB
              </div>
            </div>

            {/* 响应详情 */}
            <Accordion type="single" collapsible className="w-full">
              {/* 响应头 */}
              <AccordionItem value="headers">
                <AccordionTrigger>响应头</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-muted rounded-md p-4 overflow-auto max-h-[300px]">
                    <pre className="text-sm">
                      {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="py-1">
                          <span className="font-semibold">{key}:</span> {value}
                        </div>
                      ))}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 响应体 */}
              <AccordionItem value="body">
                <AccordionTrigger>响应体</AccordionTrigger>
                <AccordionContent>
                  <div className="bg-muted rounded-md p-4 overflow-auto max-h-[400px]">
                    <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                      {formatJson(response.data)}
                    </pre>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="text-muted-foreground mb-2">
              {isLoading ? "正在发送请求..." : "发送请求后将在此处显示响应结果"}
            </div>
            {isLoading && (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
