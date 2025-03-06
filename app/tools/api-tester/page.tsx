"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Send, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// 定义请求方法选项
const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"] as const;

// 定义表单验证模式
const formSchema = z.object({
  url: z.string().url({ message: "请输入有效的 URL" }),
  method: z.enum(HTTP_METHODS),
  headers: z.array(
    z.object({
      key: z.string().min(1, { message: "请输入 Header 名称" }),
      value: z.string(),
    })
  ),
  body: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// 定义响应类型
interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  time: number;
  size: number;
}

export default function ApiTesterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"headers" | "body">("headers");

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      method: "GET",
      headers: [{ key: "", value: "" }],
      body: "",
    },
  });

  // 添加 Header
  const addHeader = () => {
    const currentHeaders = form.getValues("headers");
    form.setValue("headers", [...currentHeaders, { key: "", value: "" }]);
  };

  // 删除 Header
  const removeHeader = (index: number) => {
    const currentHeaders = form.getValues("headers");
    if (currentHeaders.length > 1) {
      form.setValue(
        "headers",
        currentHeaders.filter((_, i) => i !== index)
      );
    }
  };

  // 发送请求
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setResponse(null);

    try {
      // 构建请求头
      const headers: Record<string, string> = {};
      values.headers.forEach((header) => {
        if (header.key.trim()) {
          headers[header.key] = header.value;
        }
      });

      // 记录开始时间
      const startTime = performance.now();

      // 构建请求选项
      const options: RequestInit = {
        method: values.method,
        headers,
      };

      // 添加请求体（如果不是 GET 或 HEAD 请求）
      if (values.method !== "GET" && values.method !== "HEAD" && values.body) {
        options.body = values.body;
      }

      // 发送请求
      const res = await fetch(values.url, options);
      
      // 计算请求时间
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // 获取响应头
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // 尝试解析响应体
      let responseData: unknown;
      let responseSize = 0;
      
      try {
        const contentType = res.headers.get("content-type") || "";
        const blob = await res.blob();
        responseSize = blob.size;
        
        if (contentType.includes("application/json")) {
          responseData = JSON.parse(await blob.text());
        } else if (contentType.includes("text/")) {
          responseData = await blob.text();
        } else {
          responseData = `二进制数据 (${blob.type}), 大小: ${blob.size} 字节`;
        }
      } catch {
        responseData = "无法解析响应数据";
      }

      // 设置响应数据
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data: responseData,
        time: Math.round(responseTime),
        size: responseSize,
      });

      toast.success("请求已完成");
    } catch (error) {
      console.error("API 请求错误:", error);
      toast.error("请求失败: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">API 测试工具</h1>
        <p className="text-muted-foreground">
          测试各种 HTTP API 接口，支持自定义请求方法、请求头和请求体
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 请求表单 */}
        <Card>
          <CardHeader>
            <CardTitle>请求配置</CardTitle>
            <CardDescription>设置 API 请求的 URL、方法、请求头和请求体</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col space-y-4">
                  {/* URL 和请求方法 */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <FormField
                      control={form.control}
                      name="method"
                      render={({ field }) => (
                        <FormItem className="md:w-1/4">
                          <FormLabel>请求方法</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择方法" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {HTTP_METHODS.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem className="md:w-3/4">
                          <FormLabel>URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://api.example.com/endpoint"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 请求头和请求体 */}
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "headers" | "body")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="headers">请求头</TabsTrigger>
                      <TabsTrigger value="body" disabled={form.watch("method") === "GET" || form.watch("method") === "HEAD"}>
                        请求体
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="headers" className="space-y-4 mt-4">
                      {form.watch("headers").map((_, index) => (
                        <div key={index} className="flex items-end gap-2">
                          <FormField
                            control={form.control}
                            name={`headers.${index}.key`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                                  Header 名称
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Content-Type"
                                    {...field}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`headers.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className={index !== 0 ? "sr-only" : undefined}>
                                  Header 值
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="application/json"
                                    {...field}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeHeader(index)}
                            disabled={form.watch("headers").length <= 1 || isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addHeader}
                        disabled={isLoading}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        添加请求头
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="body" className="space-y-4 mt-4">
                      <FormField
                        control={form.control}
                        name="body"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>请求体</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={`{\n  "key": "value"\n}`}
                                className="min-h-[200px] font-mono"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormDescription>
                              输入 JSON 或其他格式的请求体数据
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      发送请求中...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      发送请求
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* 响应结果 */}
        <Card>
          <CardHeader>
            <CardTitle>响应结果</CardTitle>
            <CardDescription>
              API 请求的响应状态、头信息和数据
            </CardDescription>
          </CardHeader>
          <CardContent>
            {response ? (
              <div className="space-y-4">
                {/* 响应状态 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-2xl font-bold ${getStatusColor(response.status)}`}>
                      {response.status}
                    </span>
                    <span className="text-muted-foreground">{response.statusText}</span>
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
                {isLoading && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 