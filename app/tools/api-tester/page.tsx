"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ApiRequestForm, { FormValues } from "./components/ApiRequestForm";
import ApiResponseDisplay, {
  ApiResponse,
} from "./components/ApiResponseDisplay";
import SavedConfigs from "./components/SavedConfigs";

export default function ApiTesterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"tester" | "saved">("tester");
  const [savedConfigs, setSavedConfigs] = useState<
    { name: string; config: FormValues }[]
  >([]);
  const [currentConfig, setCurrentConfig] = useState<FormValues | undefined>(
    undefined
  );

  // 从本地存储加载已保存的配置
  useEffect(() => {
    const configs = localStorage.getItem("api-tester-configs");
    if (configs) {
      try {
        setSavedConfigs(JSON.parse(configs));
      } catch (e) {
        console.error("无法解析保存的配置:", e);
      }
    }
  }, []);

  // 发送请求
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setResponse(null);

    try {
      // 构建请求头
      const headers: Record<string, string> = {};
      values.headers.forEach(header => {
        if (header.key.trim()) {
          headers[header.key] = header.value;
        }
      });

      // 记录开始时间
      const startTime = performance.now();

      // 构建请求选项
      const options: RequestInit = {
        method: values.method,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
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
      toast.error(
        "请求失败: " + (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 保存配置
  const saveConfig = (values: FormValues) => {
    if (!values.name) {
      toast.error("请输入配置名称");
      return;
    }

    // 检查是否存在同名配置
    const existingIndex = savedConfigs.findIndex(
      item => item.name === values.name
    );
    const newConfig = {
      name: values.name,
      config: values,
    };

    if (existingIndex >= 0) {
      // 存在同名配置，进行覆盖
      const newConfigs = [...savedConfigs];
      newConfigs[existingIndex] = newConfig;
      setSavedConfigs(newConfigs);
      localStorage.setItem("api-tester-configs", JSON.stringify(newConfigs));
      toast.success("配置已更新");
    } else {
      // 不存在同名配置，添加新配置
      const newConfigs = [...savedConfigs, newConfig];
      setSavedConfigs(newConfigs);
      localStorage.setItem("api-tester-configs", JSON.stringify(newConfigs));
      toast.success("配置已保存");
    }
  };

  // 加载配置
  const loadConfig = (config: FormValues) => {
    setCurrentConfig(config);
    setActiveTab("tester");
    toast.success("配置已加载");
  };

  // 删除配置
  const deleteConfig = (index: number) => {
    const newConfigs = [...savedConfigs];
    newConfigs.splice(index, 1);
    setSavedConfigs(newConfigs);
    localStorage.setItem("api-tester-configs", JSON.stringify(newConfigs));
    toast.success("配置已删除");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">API 测试工具</h1>
        <p className="text-muted-foreground">
          测试各种 HTTP API
          接口，支持自定义请求方法、请求头和请求体，可保存测试用例
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as "tester" | "saved")}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tester">测试工具</TabsTrigger>
          <TabsTrigger value="saved">保存的用例（LocalStorage）</TabsTrigger>
        </TabsList>

        <TabsContent value="tester" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 请求表单 */}
            <ApiRequestForm
              onSubmit={onSubmit}
              isLoading={isLoading}
              defaultValues={currentConfig}
              onSaveConfig={saveConfig}
            />

            {/* 响应结果 */}
            <ApiResponseDisplay response={response} isLoading={isLoading} />
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <SavedConfigs
            configs={savedConfigs}
            onLoadConfig={loadConfig}
            onDeleteConfig={deleteConfig}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
