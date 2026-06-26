"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import ApiRequestForm, { FormValues } from "./components/ApiRequestForm";
import ApiResponseDisplay, {
  ApiResponse,
} from "./components/ApiResponseDisplay";
import SavedConfigs from "./components/SavedConfigs";

type ApiTesterTab = "tester" | "saved";
const API_TESTER_TABS: ApiTesterTab[] = ["tester", "saved"];

function getInitialApiTesterTab(): ApiTesterTab {
  if (typeof window === "undefined") return "tester";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return API_TESTER_TABS.includes(tab as ApiTesterTab)
    ? (tab as ApiTesterTab)
    : "tester";
}

export default function ApiTesterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ApiTesterTab>("tester");
  const [savedConfigs, setSavedConfigs] = useState<
    { name: string; config: FormValues }[]
  >([]);
  const [deleteConfigIndex, setDeleteConfigIndex] = useState<number | null>(
    null
  );
  const [currentConfig, setCurrentConfig] = useState<FormValues | undefined>(
    undefined
  );

  const handleTabChange = (value: string) => {
    const nextTab = API_TESTER_TABS.includes(value as ApiTesterTab)
      ? (value as ApiTesterTab)
      : "tester";
    setActiveTab(nextTab);
    const url = new URL(window.location.href);
    if (nextTab === "tester") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", nextTab);
    }
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    setActiveTab(getInitialApiTesterTab());
  }, []);

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
    handleTabChange("tester");
    toast.success("配置已加载");
  };

  // 删除配置
  const confirmDeleteConfig = () => {
    if (deleteConfigIndex === null) return;
    const newConfigs = [...savedConfigs];
    newConfigs.splice(deleteConfigIndex, 1);
    setSavedConfigs(newConfigs);
    localStorage.setItem("api-tester-configs", JSON.stringify(newConfigs));
    setDeleteConfigIndex(null);
    toast.success("配置已删除");
  };

  return (
    <div className="flex flex-col container mx-auto py-6 gap-6">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tester" className="h-11">
            测试工具
          </TabsTrigger>
          <TabsTrigger value="saved" className="h-11">
            保存的用例
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="tester"
          className="mt-4 flex flex-col gap-4 sm:mt-6 sm:gap-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
            onDeleteConfig={setDeleteConfigIndex}
          />
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={deleteConfigIndex !== null}
        onOpenChange={open => !open && setDeleteConfigIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除测试用例</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfigIndex !== null && (
                <>
                  将删除测试用例「{savedConfigs[deleteConfigIndex]?.name}」。
                  <span className="text-destructive">此操作无法撤销。</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteConfig}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
