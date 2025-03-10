'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 定义请求方法选项
export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"] as const;

// 定义表单验证模式
export const formSchema = z.object({
  url: z.string().url({ message: "请输入有效的 URL" }),
  method: z.enum(HTTP_METHODS),
  headers: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ),
  body: z.string().optional(),
  name: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

interface ApiRequestFormProps {
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
  defaultValues?: FormValues;
  onSaveConfig?: (values: FormValues) => void;
}

export default function ApiRequestForm({ 
  onSubmit, 
  isLoading, 
  defaultValues,
  onSaveConfig
}: ApiRequestFormProps) {
  const [activeTab, setActiveTab] = useState<"headers" | "body">("headers");
  const [configName, setConfigName] = useState(defaultValues?.name || "");

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      url: "",
      method: "GET",
      headers: [{ key: "", value: "" }],
      body: "",
      name: "",
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
    form.setValue(
      "headers",
      currentHeaders.filter((_, i) => i !== index)
    );
  };

  // 保存配置
  const handleSaveConfig = () => {
    if (!configName.trim()) return;
    
    const values = form.getValues();
    onSaveConfig?.({
      ...values,
      name: configName
    });
  };

  return (
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
                        disabled={isLoading}
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

            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="测试用例名称"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  disabled={isLoading}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleSaveConfig}
                  disabled={isLoading || !configName.trim()}
                >
                  保存用例
                </Button>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                发送请求
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 