"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Save,
  Upload,
  X,
  Eye,
  EyeOff,
  Copy,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface TestResult {
  step: string;
  status: "success" | "error" | "pending";
  message?: string;
  data?: Record<string, unknown>;
}

interface OpenAIConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  useProxy: boolean;
  useTemperature: boolean;
  useMaxTokens: boolean;
}

type OpenAIError = Error | unknown;

export default function OpenAICheckerPage() {
  const [endpoint, setEndpoint] = useState("https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-3.5-turbo");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [useTemperature, setUseTemperature] = useState(true);
  const [useMaxTokens, setUseMaxTokens] = useState(true);
  const [prompt, setPrompt] = useState("你好，请简单介绍一下你自己。");
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [useProxy, setUseProxy] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<
    { name: string; config: OpenAIConfig }[]
  >([]);
  const [configName, setConfigName] = useState("");
  const [endpointError, setEndpointError] = useState("");
  const [activeTab, setActiveTab] = useState("connection");
  const [showApiKey, setShowApiKey] = useState(false);
  const [copyState, setCopyState] = useState<{ [key: string]: boolean }>({});
  const [response, setResponse] = useState("");
  const [openModelSelector, setOpenModelSelector] = useState(false);
  const [modelInputValue, setModelInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 从本地存储加载已保存的配置
  useEffect(() => {
    const configs = localStorage.getItem("openai-checker-configs");
    if (configs) {
      try {
        setSavedConfigs(JSON.parse(configs));
      } catch (e) {
        console.error("无法解析保存的配置:", e);
      }
    }
  }, []);

  const validateEndpoint = (value: string) => {
    if (!value) {
      setEndpointError("Endpoint 不能为空");
      return false;
    }

    try {
      // 检查是否是有效的 URL
      new URL(value);
      setEndpointError("");
      return true;
    } catch {
      setEndpointError("请输入有效的 URL，例如 https://api.openai.com/v1");
      return false;
    }
  };

  const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndpoint(value);
    if (value) validateEndpoint(value);
  };

  const saveConfig = () => {
    if (!configName.trim()) {
      toast.error("请输入配置名称");
      return;
    }

    // 检查是否存在同名配置
    const existingIndex = savedConfigs.findIndex(
      item => item.name === configName
    );
    const newConfig = {
      name: configName,
      config: {
        endpoint,
        apiKey,
        model,
        temperature,
        maxTokens,
        useProxy,
        useTemperature,
        useMaxTokens,
      },
    };

    if (existingIndex >= 0) {
      // 存在同名配置，进行覆盖
      const newConfigs = [...savedConfigs];
      newConfigs[existingIndex] = newConfig;
      setSavedConfigs(newConfigs);
      localStorage.setItem(
        "openai-checker-configs",
        JSON.stringify(newConfigs)
      );
      toast.success("配置已更新");
    } else {
      // 不存在同名配置，添加新配置
      const newConfigs = [...savedConfigs, newConfig];
      setSavedConfigs(newConfigs);
      localStorage.setItem(
        "openai-checker-configs",
        JSON.stringify(newConfigs)
      );
      toast.success("配置已保存");
    }
    setConfigName("");
  };

  const loadConfig = (config: OpenAIConfig, configName?: string) => {
    // 清空之前的测试结果
    setTestResults([]);
    setResponse("");

    // 加载配置
    setEndpoint(config.endpoint || "https://api.openai.com/v1");
    setApiKey(config.apiKey || "");
    setModel(config.model || "gpt-3.5-turbo");
    setTemperature(config.temperature || 0.7);
    setMaxTokens(config.maxTokens || 1000);
    setUseProxy(config.useProxy !== undefined ? config.useProxy : false);
    setUseTemperature(
      config.useTemperature !== undefined ? config.useTemperature : true
    );
    setUseMaxTokens(
      config.useMaxTokens !== undefined ? config.useMaxTokens : true
    );

    // 更新模型输入值
    const selectedOption = modelOptions.find(
      option => option.value === config.model
    );
    setModelInputValue(selectedOption ? selectedOption.label : config.model);

    // 如果提供了配置名称，则设置配置名称以便覆盖
    if (configName) {
      setConfigName(configName);
    }

    toast.success("配置已加载");

    // 自动跳转到连接测试标签页
    setActiveTab("connection");
  };

  const deleteConfig = (index: number) => {
    const newConfigs = [...savedConfigs];
    newConfigs.splice(index, 1);
    setSavedConfigs(newConfigs);
    localStorage.setItem("openai-checker-configs", JSON.stringify(newConfigs));
    toast.success("配置已删除");
  };

  const getErrorMessage = (error: OpenAIError): string => {
    console.error("详细错误信息:", error);

    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        return `网络请求失败 (Failed to fetch)，可能原因：
1. 跨域问题 (CORS) - 浏览器安全策略阻止了请求
2. Endpoint URL 格式不正确 - 请确保包含协议(http/https)和正确的端口
3. 网络连接问题 - 请检查您的网络连接
4. API 服务不可用 - 请确认服务是否在线
5. 防火墙或安全设置阻止了请求

建议解决方案:
- 使用支持 CORS 的 API 端点
- 使用代理服务器转发请求
- 检查网络连接
- 确认 API 端点是否可用`;
      }

      if (error.message.includes("401")) {
        return "API Key 无效或未授权，请检查您的 API Key 是否正确，是否已过期，或是否有足够的权限";
      }

      if (error.message.includes("404")) {
        return "API 路径不存在，请检查 Endpoint 是否正确。确保您的 API 端点支持 /chat/completions 路径";
      }

      if (error.message.includes("429")) {
        return "请求过于频繁或超出配额限制，请稍后再试。您可能需要升级您的 API 计划或等待配额重置";
      }

      if (error.message.includes("ENOTFOUND")) {
        return "Endpoint 域名无法解析，请检查域名是否正确拼写，或者 DNS 服务是否正常";
      }

      if (error.message.includes("ECONNREFUSED")) {
        return "Endpoint 连接被拒绝，请检查地址和端口是否正确。服务器可能未运行或不接受连接";
      }

      if (error.message.includes("NetworkError")) {
        return "网络错误，可能是由于跨域 (CORS) 限制导致，请确保 API 服务允许跨域请求，或考虑使用代理服务器";
      }

      // 添加更多常见错误的处理
      if (
        error.message.includes("timeout") ||
        error.message.includes("timed out")
      ) {
        return "请求超时，服务器响应时间过长。请检查网络连接或服务器负载，或增加超时时间";
      }

      if (error.message.includes("JSON")) {
        return "响应解析错误，服务器返回的不是有效的 JSON 格式。请检查 API 端点是否正确，或服务器是否返回了非 JSON 内容";
      }

      return `${error.name || "错误"}: ${error.message}`;
    }

    return "未知错误，请查看控制台获取详细信息";
  };

  const updateTestResults = (
    step: string,
    status: "success" | "error" | "pending",
    message?: string,
    data?: Record<string, unknown>
  ) => {
    setTestResults(prev => {
      const existing = prev.findIndex(r => r.step === step);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { step, status, message, data };
        return updated;
      }
      return [...prev, { step, status, message, data }];
    });
  };

  const validateOpenAIConnection = async () => {
    if (!endpoint || !apiKey) {
      toast.error("请填写所有必填参数");
      return;
    }

    if (!validateEndpoint(endpoint)) {
      return;
    }

    setIsTesting(true);
    setTestResults([]);
    setResponse("");

    try {
      // 初始化连接
      updateTestResults("初始化连接", "pending");

      // 构建 API URL
      const apiUrl = `${endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint}/chat/completions`;
      updateTestResults("初始化连接", "success", `API URL: ${apiUrl}`);

      // 测试 API 连接
      try {
        updateTestResults("API 连接测试", "pending");

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        };

        const requestBody: Record<string, unknown> = {
          model: model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        };

        // 根据开关状态决定是否包含参数
        if (useTemperature) {
          requestBody.temperature = parseFloat(temperature.toString());
        }

        if (useMaxTokens) {
          requestBody.max_tokens = parseInt(maxTokens.toString());
        }

        // 记录请求信息，方便调试
        const requestInfo = {
          url: apiUrl,
          method: "POST",
          headers: { ...headers, Authorization: "Bearer sk-***" }, // 隐藏实际 API Key
          body: requestBody,
        };
        console.log("OpenAI API 请求信息:", requestInfo);

        try {
          // 发送请求
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            // 尝试解析错误响应为 JSON
            let errorJson: Record<string, unknown> | null = null;
            try {
              errorJson = JSON.parse(errorText);
              // 设置响应内容以便用户查看
              setResponse(JSON.stringify(errorJson, null, 2));
            } catch {
              // 如果不是 JSON，直接设置文本
              setResponse(errorText);
            }
            throw new Error(`HTTP error ${response.status}: ${errorText}`);
          }

          const data = await response.json();

          if (data.error) {
            // 设置响应内容以便用户查看
            setResponse(JSON.stringify(data, null, 2));
            throw new Error(
              `API error: ${data.error.message || JSON.stringify(data.error)}`
            );
          }

          // 提取响应内容
          const responseContent =
            data.choices && data.choices[0] && data.choices[0].message
              ? data.choices[0].message.content
              : JSON.stringify(data, null, 2);

          setResponse(responseContent);

          // 计算使用的 tokens
          const usedTokens = data.usage
            ? `输入: ${data.usage.prompt_tokens || 0} tokens, 输出: ${data.usage.completion_tokens || 0} tokens, 总计: ${data.usage.total_tokens || 0} tokens`
            : "无 token 使用信息";

          updateTestResults(
            "API 连接测试",
            "success",
            `连接成功，${usedTokens}`,
            data
          );
          toast.success("OpenAI 接口连接成功");
        } catch (fetchError) {
          // 处理 fetch 错误
          if (
            fetchError instanceof TypeError &&
            fetchError.message.includes("Failed to fetch")
          ) {
            // 设置一个友好的错误消息
            const corsMessage =
              "这可能是由于跨域 (CORS) 限制导致的。浏览器的安全策略阻止了从一个源访问另一个源的资源。";
            const networkMessage =
              "或者可能是网络连接问题，请检查您的网络连接是否正常。";
            const endpointMessage =
              "请确保您的 Endpoint URL 格式正确，包含协议(http/https)和正确的端口。";
            const proxyMessage = "如果您在使用代理，请确保代理配置正确。";

            const errorMsg = `网络请求失败 (Failed to fetch):\n\n${corsMessage}\n\n${networkMessage}\n\n${endpointMessage}\n\n${proxyMessage}\n\n请尝试以下解决方案:\n1. 使用支持 CORS 的 API 端点\n2. 使用代理服务器转发请求\n3. 检查网络连接\n4. 确认 API 端点是否可用`;

            setResponse(
              `请求失败: Failed to fetch\n\n请求 URL: ${apiUrl}\n\n${errorMsg}`
            );
            updateTestResults("API 连接测试", "error", errorMsg);
            throw new Error(errorMsg);
          }
          throw fetchError;
        }
      } catch (error) {
        const errorMsg = getErrorMessage(error);
        updateTestResults("API 连接测试", "error", errorMsg);
        throw error;
      }
    } catch (error) {
      console.error("OpenAI 连接测试失败:", error);
      const errorMsg = getErrorMessage(error);
      toast.error(`连接失败: ${errorMsg}`, {
        duration: 6000, // 增加显示时间
      });

      // 添加一个总体错误结果
      updateTestResults("连接测试", "error", errorMsg);
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // 设置复制状态为成功
        setCopyState({ ...copyState, [field]: true });

        // 2秒后重置状态
        setTimeout(() => {
          setCopyState({ ...copyState, [field]: false });
        }, 2000);

        toast.success("已复制到剪贴板");
      })
      .catch(err => {
        console.error("复制失败:", err);
        toast.error("复制失败");
      });
  };

  // 预设模型列表
  const modelOptions = useMemo(
    () => [
      { value: "deepseek-chat", label: "DeepSeek Chat" },
      { value: "deepseek-reasoner", label: "DeepSeek Reasoner" },
      { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
      { value: "gpt-3.5-turbo-16k", label: "GPT-3.5 Turbo 16K" },
      { value: "gpt-4", label: "GPT-4" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
      { value: "gpt-4-vision-preview", label: "GPT-4 Vision" },
      { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
      { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet" },
      { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
      { value: "qwen-turbo", label: "通义千问 Turbo" },
      { value: "qwen-plus", label: "通义千问 Plus" },
      { value: "qwen-max", label: "通义千问 Max" },
      { value: "glm-4", label: "智谱 GLM-4" },
      { value: "glm-3-turbo", label: "智谱 GLM-3-Turbo" },
    ],
    []
  );

  // 当选择预设模型时更新输入框的值
  useEffect(() => {
    const selectedOption = modelOptions.find(option => option.value === model);
    setModelInputValue(selectedOption ? selectedOption.label : model);
  }, [model, modelOptions]);

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">OpenAI 接口检测</h1>
        <p className="text-muted-foreground">
          OpenAI 兼容接口连通性及功能测试工具
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="max-w-4xl mx-auto w-full"
      >
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="connection">连接测试</TabsTrigger>
          <TabsTrigger value="configs">保存的配置（LocalStorage）</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>连接参数</CardTitle>
              <CardDescription>
                请输入您的 OpenAI 兼容接口配置信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  API Endpoint <span className="text-red-500">*</span>
                </Label>
                <div className="flex">
                  <Input
                    placeholder="https://api.openai.com/v1"
                    value={endpoint}
                    onChange={handleEndpointChange}
                    className={`${endpointError ? "border-red-500" : ""} flex-1`}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2"
                    onClick={() => copyToClipboard(endpoint, "endpoint")}
                    disabled={!endpoint}
                  >
                    {copyState["endpoint"] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {endpointError && (
                  <p className="text-sm text-red-500">{endpointError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  API Key <span className="text-red-500">*</span>
                </Label>
                <div className="flex">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="flex-1"
                    placeholder="sk-..."
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2"
                    onClick={() => copyToClipboard(apiKey, "apiKey")}
                    disabled={!apiKey}
                  >
                    {copyState["apiKey"] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    模型 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <div className="flex">
                      <Input
                        ref={inputRef}
                        value={modelInputValue}
                        onChange={e => setModelInputValue(e.target.value)}
                        placeholder="选择或输入模型名称"
                        className="w-full"
                        onFocus={() => setOpenModelSelector(true)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            setModel(modelInputValue);
                            setOpenModelSelector(false);
                            e.preventDefault();
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        type="button"
                        className="ml-2"
                        onClick={() => setOpenModelSelector(!openModelSelector)}
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                      </Button>
                    </div>
                    {openModelSelector && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-auto">
                        <div className="p-1">
                          <div className="border-t mt-1 pt-1">
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-sm"
                              onClick={() => {
                                if (
                                  modelInputValue &&
                                  !modelOptions.some(
                                    option => option.label === modelInputValue
                                  )
                                ) {
                                  setModel(modelInputValue);
                                }
                                setOpenModelSelector(false);
                              }}
                            >
                              使用自定义模型名称
                            </Button>
                          </div>
                          {modelOptions.map(option => (
                            <div
                              key={option.value}
                              className={cn(
                                "px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                                model === option.value &&
                                  "bg-accent text-accent-foreground"
                              )}
                              onClick={() => {
                                setModel(option.value);
                                setOpenModelSelector(false);
                              }}
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Temperature (0-2)</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="use-temperature"
                        checked={useTemperature}
                        onCheckedChange={setUseTemperature}
                      />
                      <Label
                        htmlFor="use-temperature"
                        className="text-xs text-muted-foreground"
                      >
                        启用
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={e =>
                        setTemperature(parseFloat(e.target.value) || 0)
                      }
                      disabled={!useTemperature}
                      className={!useTemperature ? "opacity-50" : ""}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>最大 Tokens</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="use-max-tokens"
                        checked={useMaxTokens}
                        onCheckedChange={setUseMaxTokens}
                      />
                      <Label
                        htmlFor="use-max-tokens"
                        className="text-xs text-muted-foreground"
                      >
                        启用
                      </Label>
                    </div>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="32000"
                    value={maxTokens}
                    onChange={e =>
                      setMaxTokens(parseInt(e.target.value) || 1000)
                    }
                    disabled={!useMaxTokens}
                    className={!useMaxTokens ? "opacity-50" : ""}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="use-proxy"
                    checked={useProxy}
                    onCheckedChange={setUseProxy}
                  />
                  <Label htmlFor="use-proxy">使用代理（仅后端生效）</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>测试提示词</Label>
                <Textarea
                  placeholder="输入测试提示词..."
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="pt-2">
                <Button
                  onClick={validateOpenAIConnection}
                  className="w-full"
                  disabled={isTesting}
                >
                  {isTesting ? "正在检测..." : "开始检测"}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2 w-full">
                <Input
                  placeholder="配置名称"
                  value={configName}
                  onChange={e => setConfigName(e.target.value)}
                />
                <Button onClick={saveConfig} disabled={!configName.trim()}>
                  <Save className="mr-2 h-4 w-4" />
                  保存配置
                </Button>
              </div>
            </CardFooter>
          </Card>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>测试结果</CardTitle>
                <CardDescription>OpenAI 接口测试的详细结果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index}>
                      <Alert
                        className={
                          result.status === "success"
                            ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                            : result.status === "error"
                              ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                              : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                        }
                      >
                        {result.status === "success" && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {result.status === "error" && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        {result.status === "pending" && (
                          <div className="h-4 w-4 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
                        )}
                        <AlertTitle>{result.step}</AlertTitle>
                        <AlertDescription className="whitespace-pre-line">
                          {result.message}
                        </AlertDescription>
                      </Alert>
                    </div>
                  ))}
                </div>

                {response && (
                  <div className="mt-4">
                    <div className="font-medium mb-2">API 响应:</div>
                    <div className="p-4 border rounded-md bg-muted/20 whitespace-pre-wrap">
                      {response}
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(response, "response")}
                      >
                        {copyState["response"] ? (
                          <Check className="h-4 w-4 mr-1" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        复制响应
                      </Button>
                    </div>
                  </div>
                )}

                {testResults.some(r => r.status === "error") && (
                  <div className="mt-4 p-4 border border-yellow-500 rounded-md bg-yellow-50 dark:bg-yellow-950/20">
                    <h3 className="font-medium mb-2">常见问题排查：</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>
                        确保 API Endpoint URL 格式正确，包含协议（http:// 或
                        https://）
                      </li>
                      <li>检查 API Key 是否正确</li>
                      <li>确认所选模型在您的 API 提供商中可用</li>
                      <li>如果遇到跨域问题，需要在 API 服务端配置 CORS 策略</li>
                      <li>
                        检查网络连接是否正常，特别是在使用私有网络或 VPN 时
                      </li>
                      <li>
                        如果使用第三方 API 服务，确认其是否完全兼容 OpenAI 接口
                      </li>
                    </ul>

                    {testResults.some(r =>
                      r.message?.includes("Failed to fetch")
                    ) && (
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">
                          解决 &ldquo;Failed to fetch&rdquo; 错误：
                        </h3>
                        <div className="bg-muted p-3 rounded-md border border-border text-sm">
                          <p className="mb-2 font-medium">
                            这个错误通常是由于浏览器无法连接到 API
                            服务器导致的，常见原因包括：
                          </p>
                          <ol className="list-decimal pl-5 space-y-1">
                            <li>
                              <span className="font-medium">
                                跨域 (CORS) 限制
                              </span>{" "}
                              - 浏览器的安全策略阻止了从一个源访问另一个源的资源
                            </li>
                            <li>
                              <span className="font-medium">网络连接问题</span>{" "}
                              - 您的网络可能无法访问 API 服务器
                            </li>
                            <li>
                              <span className="font-medium">
                                API 端点不可用
                              </span>{" "}
                              - 服务器可能已关闭或不接受连接
                            </li>
                            <li>
                              <span className="font-medium">
                                防火墙或安全设置
                              </span>{" "}
                              - 可能阻止了对 API 服务器的访问
                            </li>
                          </ol>

                          <p className="mt-3 mb-2 font-medium">
                            可能的解决方案：
                          </p>
                          <ol className="list-decimal pl-5 space-y-1">
                            <li>
                              <span className="font-medium">
                                使用代理服务器
                              </span>{" "}
                              - 在服务器端发起请求可以绕过 CORS 限制
                              <ul className="list-disc pl-5 mt-1 text-xs">
                                <li>
                                  在本工具中启用&ldquo;使用代理&rdquo;选项（需要后端支持）
                                </li>
                                <li>或使用自己的代理服务器转发请求</li>
                              </ul>
                            </li>
                            <li>
                              <span className="font-medium">
                                使用支持 CORS 的 API 端点
                              </span>
                              <ul className="list-disc pl-5 mt-1 text-xs">
                                <li>确认您的 API 提供商是否支持跨域请求</li>
                                <li>
                                  如果您自己控制 API 服务器，添加适当的 CORS 头
                                </li>
                              </ul>
                            </li>
                            <li>
                              <span className="font-medium">检查网络连接</span>
                              <ul className="list-disc pl-5 mt-1 text-xs">
                                <li>
                                  尝试在浏览器中直接访问 API 端点（可能会返回
                                  401 错误，但至少表明端点可达）
                                </li>
                                <li>检查您的网络是否有特殊限制或防火墙规则</li>
                              </ul>
                            </li>
                            <li>
                              <span className="font-medium">
                                使用其他 API 客户端测试
                              </span>
                              <ul className="list-disc pl-5 mt-1 text-xs">
                                <li>
                                  使用 Postman、curl 或其他 API 工具测试连接
                                </li>
                                <li>
                                  如果其他工具可以连接，则问题可能是浏览器特定的
                                </li>
                              </ul>
                            </li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="configs">
          <Card>
            <CardHeader>
              <CardTitle>已保存的配置</CardTitle>
              <CardDescription>
                加载、查看或管理您保存的 OpenAI 配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savedConfigs.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  暂无保存的配置
                </div>
              ) : (
                <div className="space-y-4">
                  {savedConfigs.map((item, index) => (
                    <div
                      key={index}
                      className="border rounded-md overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-3 bg-muted/30">
                        <div className="font-medium">{item.name}</div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadConfig(item.config, item.name)}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            加载
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteConfig(index)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 text-sm space-y-2 bg-muted/10">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">Endpoint:</span>
                            <span className="ml-1 break-all">
                              {item.config.endpoint}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">模型:</span>
                            <span className="ml-1">
                              {modelOptions.find(
                                option => option.value === item.config.model
                              )?.label || item.config.model}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">API Key:</span>
                          <span className="ml-1">
                            {item.config.apiKey.substring(0, 3)}***
                            {item.config.apiKey.substring(
                              item.config.apiKey.length - 3
                            )}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">Temperature:</span>
                            <span className="ml-1">
                              {item.config.temperature}
                            </span>
                            {item.config.useTemperature === false && (
                              <span className="ml-1 text-muted-foreground">
                                (未启用)
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">最大 Tokens:</span>
                            <span className="ml-1">
                              {item.config.maxTokens}
                            </span>
                            {item.config.useMaxTokens === false && (
                              <span className="ml-1 text-muted-foreground">
                                (未启用)
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">使用代理:</span>
                          <span className="ml-1">
                            {item.config.useProxy ? "是" : "否"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
