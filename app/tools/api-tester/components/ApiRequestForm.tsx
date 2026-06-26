"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 定义请求方法选项
export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
] as const;

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

const EMPTY_FORM_VALUES: FormValues = {
  url: "",
  method: "GET",
  headers: [{ key: "", value: "" }],
  body: "",
  name: "",
};

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
  onSaveConfig,
}: ApiRequestFormProps) {
  const [activeTab, setActiveTab] = useState<"headers" | "body">("headers");
  const [configName, setConfigName] = useState(defaultValues?.name || "");

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || EMPTY_FORM_VALUES,
  });

  useEffect(() => {
    const nextValues = defaultValues || EMPTY_FORM_VALUES;
    form.reset(nextValues);
    setConfigName(nextValues.name || "");
  }, [defaultValues, form]);

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
      name: configName,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>请求配置</CardTitle>
        <CardDescription>
          设置 API 请求的 URL、方法、请求头和请求体
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-4">
              {/* URL 和请求方法 */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem className="sm:w-1/4">
                      <FormLabel className="text-xs sm:text-sm">
                        请求方法
                      </FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          value={field.value || "GET"}
                          disabled={isLoading}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm ring-offset-background transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:text-sm"
                        >
                          {HTTP_METHODS.map(method => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem className="sm:w-3/4">
                      <FormLabel className="text-xs sm:text-sm">URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://api.example.com/endpoint"
                          {...field}
                          type="url"
                          inputMode="url"
                          autoComplete="url"
                          spellCheck={false}
                          disabled={isLoading}
                          className="h-9 sm:h-10 text-xs sm:text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 请求头和请求体 */}
              <Tabs
                value={activeTab}
                onValueChange={value =>
                  setActiveTab(value as "headers" | "body")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="headers"
                    className="h-9 text-xs sm:text-sm"
                  >
                    请求头
                  </TabsTrigger>
                  <TabsTrigger
                    value="body"
                    disabled={
                      form.watch("method") === "GET" ||
                      form.watch("method") === "HEAD"
                    }
                    className="h-9 text-xs sm:text-sm"
                  >
                    请求体
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="headers"
                  className="flex flex-col mt-4 gap-4"
                >
                  {form.watch("headers").map((_, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <FormField
                        control={form.control}
                        name={`headers.${index}.key`}
                        render={({ field }) => (
                          <FormItem className="min-w-0 flex-1">
                            <FormLabel
                              className={index !== 0 ? "sr-only" : undefined}
                            >
                              Header 名称
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Content-Type"
                                {...field}
                                autoComplete="off"
                                spellCheck={false}
                                disabled={isLoading}
                                className="h-9 sm:h-10 text-xs sm:text-sm"
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
                          <FormItem className="min-w-0 flex-1">
                            <FormLabel
                              className={index !== 0 ? "sr-only" : undefined}
                            >
                              Header 值
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="application/json"
                                {...field}
                                autoComplete="off"
                                spellCheck={false}
                                disabled={isLoading}
                                className="h-9 sm:h-10 text-xs sm:text-sm"
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
                        className="h-9 sm:h-10 w-9 sm:w-10"
                        aria-label={`删除第 ${index + 1} 个请求头`}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addHeader}
                    disabled={isLoading}
                    className="mt-2 h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    添加请求头
                  </Button>
                </TabsContent>

                <TabsContent value="body" className="flex flex-col mt-4 gap-4">
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>请求体</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={`{\n  "key": "value"\n}`}
                            className="min-h-[160px] sm:min-h-[200px] font-mono text-xs sm:text-sm"
                            {...field}
                            autoComplete="off"
                            spellCheck={false}
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

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="测试用例名称"
                  name="configName"
                  autoComplete="off"
                  value={configName}
                  onChange={e => setConfigName(e.target.value)}
                  disabled={isLoading}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveConfig}
                  disabled={isLoading || !configName.trim()}
                  className="h-9 shrink-0 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
                >
                  保存用例
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                保存用例会写入当前浏览器 localStorage。若请求头或请求体包含
                token、Cookie 或其他敏感内容，请谨慎保存。
              </p>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[44px]"
              >
                发送请求
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
