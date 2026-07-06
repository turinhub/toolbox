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
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

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
  url: z.string().url({ message: "请输入有效的 URL / Enter a valid URL" }),
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
  const isEnglish = useLocale() === englishLocale;
  const copy = isEnglish
    ? {
        title: "Request config",
        description: "Set the API request URL, method, headers, and body.",
        method: "Method",
        headers: "Headers",
        body: "Body",
        headerName: "Header name",
        headerValue: "Header value",
        deleteHeader: "Delete request header {index}",
        addHeader: "Add header",
        requestBody: "Request body",
        bodyDescription: "Enter JSON or another request body format.",
        configName: "Test case name",
        saveCase: "Save case",
        saveDescription:
          "Saved cases are stored in this browser's localStorage. Be careful when headers or bodies contain tokens, cookies, or other sensitive content.",
        send: "Send request",
      }
    : {
        title: "请求配置",
        description: "设置 API 请求的 URL、方法、请求头和请求体",
        method: "请求方法",
        headers: "请求头",
        body: "请求体",
        headerName: "Header 名称",
        headerValue: "Header 值",
        deleteHeader: "删除第 {index} 个请求头",
        addHeader: "添加请求头",
        requestBody: "请求体",
        bodyDescription: "输入 JSON 或其他格式的请求体数据",
        configName: "测试用例名称",
        saveCase: "保存用例",
        saveDescription:
          "保存用例会写入当前浏览器 localStorage。若请求头或请求体包含 token、Cookie 或其他敏感内容，请谨慎保存。",
        send: "发送请求",
      };
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
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
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
                        {copy.method}
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
                    {copy.headers}
                  </TabsTrigger>
                  <TabsTrigger
                    value="body"
                    disabled={
                      form.watch("method") === "GET" ||
                      form.watch("method") === "HEAD"
                    }
                    className="h-9 text-xs sm:text-sm"
                  >
                    {copy.body}
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
                              {copy.headerName}
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
                              {copy.headerValue}
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
                        aria-label={copy.deleteHeader.replace(
                          "{index}",
                          String(index + 1)
                        )}
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
                    {copy.addHeader}
                  </Button>
                </TabsContent>

                <TabsContent value="body" className="flex flex-col mt-4 gap-4">
                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{copy.requestBody}</FormLabel>
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
                          {copy.bodyDescription}
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
                  placeholder={copy.configName}
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
                  {copy.saveCase}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {copy.saveDescription}
              </p>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[44px]"
              >
                {copy.send}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
