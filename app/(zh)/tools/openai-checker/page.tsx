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
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

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
type OpenAITab = "connection" | "configs";

const OPENAI_TABS: OpenAITab[] = ["connection", "configs"];

function getInitialOpenAITab(): OpenAITab {
  if (typeof window === "undefined") return "connection";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return OPENAI_TABS.includes(tab as OpenAITab)
    ? (tab as OpenAITab)
    : "connection";
}

export default function OpenAICheckerPage() {
  const locale = useLocale();
  const isEnglish = locale === englishLocale;
  const copy = isEnglish
    ? {
        defaultPrompt: "Hello, please briefly introduce yourself.",
        parseSavedFailed: "Could not parse saved configs:",
        endpointRequired: "Endpoint is required",
        endpointInvalid: "Enter a valid URL, such as https://api.openai.com/v1",
        enterConfigName: "Enter a config name.",
        updated: "Config updated. API Key is not saved.",
        saved: "Config saved. API Key is not saved.",
        loaded: "Config loaded. Re-enter API Key.",
        deleted: "Config deleted.",
        unknownError: "Unknown error. Check the console for details.",
        errorPrefix: "Error",
        failedFetch: `Network request failed (Failed to fetch). Possible causes:
1. CORS issue - browser security policy blocked the request
2. Endpoint URL is incorrect - make sure it includes protocol (http/https) and the correct port
3. Network connectivity issue
4. API service is unavailable
5. Firewall or security settings blocked the request

Suggested fixes:
- Use an API endpoint that supports CORS
- Forward requests through a proxy server
- Check network connectivity
- Confirm the API endpoint is available`,
        unauthorized:
          "API Key is invalid or unauthorized. Check whether the API Key is correct, expired, or lacks permission.",
        notFound:
          "API path does not exist. Check the Endpoint and make sure it supports /chat/completions.",
        rateLimit:
          "Requests are too frequent or quota is exceeded. Try again later, upgrade the plan, or wait for quota reset.",
        dnsFailed:
          "Endpoint domain cannot be resolved. Check spelling or DNS service status.",
        refused:
          "Endpoint connection was refused. Check the address and port; the server may not be running or accepting connections.",
        networkCors:
          "Network error. This may be caused by CORS restrictions. Ensure the API service allows cross-origin requests or use a proxy server.",
        timeout:
          "Request timed out. The server took too long to respond. Check network/server load or increase timeout.",
        jsonError:
          "Response parsing error. The server did not return valid JSON. Check the API endpoint or server response.",
        required: "Fill in all required parameters.",
        init: "Initialize connection",
        apiTest: "API connection test",
        tokenUsage:
          "Input: {prompt} tokens, output: {completion} tokens, total: {total} tokens",
        noTokenUsage: "No token usage information",
        successMessage: "Connection succeeded, {tokens}",
        successToast: "OpenAI-compatible API connected successfully.",
        fetchFailureResponse:
          "Request failed: Failed to fetch\n\nRequest URL: {url}\n\n{message}",
        fetchFailureDetail: `Network request failed (Failed to fetch):

This may be caused by CORS restrictions. The browser security policy blocked access from one origin to another.

Or it may be a network connectivity issue. Check whether your network is working.

Make sure your Endpoint URL is correct and includes protocol (http/https) and the right port.

If you use a proxy, make sure the proxy is configured correctly.

Try these fixes:
1. Use an API endpoint that supports CORS
2. Forward requests through a proxy server
3. Check network connectivity
4. Confirm the API endpoint is available`,
        failed: "Connection failed: {message}",
        connectionTest: "Connection test",
        copied: "Copied to clipboard",
        copyFailed: "Copy failed",
        tabsConnection: "Connection test",
        tabsConfigs: "Saved configs (LocalStorage)",
        paramsTitle: "Connection parameters",
        paramsDesc: "Enter your OpenAI-compatible API configuration.",
        copyEndpoint: "Copy API Endpoint",
        hideApiKey: "Hide API Key",
        showApiKey: "Show API Key",
        copyApiKey: "Copy API Key",
        model: "Model",
        modelPlaceholder: "Select or enter a model name",
        collapseModels: "Collapse model list",
        expandModels: "Expand model list",
        customModel: "Use custom model name",
        enabled: "Enabled",
        maxTokens: "Max Tokens",
        useProxy: "Use proxy (backend only)",
        prompt: "Test prompt",
        promptPlaceholder: "Enter a test prompt...",
        testing: "Testing...",
        start: "Start test",
        configName: "Config name",
        saveConfig: "Save config",
        saveHint:
          "Saved configs are stored in this browser's localStorage, but API Key is not saved. Re-enter it after loading.",
        resultsTitle: "Test results",
        resultsDesc: "Detailed OpenAI-compatible API test results",
        apiResponse: "API response:",
        copyResponse: "Copy response",
        troubleshooting: "Common troubleshooting:",
        troubleshootingItems: [
          "Ensure the API Endpoint URL is correct and includes protocol (http:// or https://).",
          "Check whether the API Key is correct.",
          "Confirm the selected model is available from your API provider.",
          "If CORS errors occur, configure the CORS policy on the API server.",
          "Check network connectivity, especially when using private networks or VPN.",
          "If using a third-party API service, confirm it is fully compatible with the OpenAI API.",
        ],
        failedFetchTitle: 'Fix "Failed to fetch" errors:',
        failedFetchIntro:
          "This usually means the browser cannot connect to the API server. Common causes include:",
        failedFetchCauses: [
          {
            title: "CORS restrictions",
            body: "Browser security policy blocked access from one origin to another.",
          },
          {
            title: "Network connectivity issue",
            body: "Your network may not be able to reach the API server.",
          },
          {
            title: "API endpoint unavailable",
            body: "The server may be down or not accepting connections.",
          },
          {
            title: "Firewall or security settings",
            body: "Access to the API server may be blocked.",
          },
        ],
        failedFetchSolutionsTitle: "Possible fixes:",
        failedFetchSolutions: [
          {
            title: "Use a proxy server",
            body: "Server-side requests can bypass browser CORS restrictions.",
            items: [
              'Enable "Use proxy" in this tool if backend support is available.',
              "Or forward requests through your own proxy server.",
            ],
          },
          {
            title: "Use an API endpoint that supports CORS",
            items: [
              "Confirm whether your API provider supports cross-origin requests.",
              "If you control the API server, add the appropriate CORS headers.",
            ],
          },
          {
            title: "Check network connectivity",
            items: [
              "Try opening the API endpoint directly in the browser. A 401 response can still indicate the endpoint is reachable.",
              "Check whether your network has special restrictions or firewall rules.",
            ],
          },
          {
            title: "Test with another API client",
            items: [
              "Use Postman, curl, or another API client to test connectivity.",
              "If another client works, the issue may be browser-specific.",
            ],
          },
        ],
        savedConfigs: "Saved configs",
        savedDescription: "Load, inspect, or manage saved OpenAI configs.",
        noConfigs: "No saved configs",
        load: "Load",
        delete: "Delete",
        notSaved: "Not saved. Re-enter after loading.",
        disabled: "(disabled)",
        proxy: "Proxy:",
        yes: "Yes",
        no: "No",
        confirmDelete: "Delete config?",
        confirmDeleteText: 'Config "{name}" will be deleted.',
        irreversible: "This action cannot be undone.",
        cancel: "Cancel",
      }
    : {
        defaultPrompt: "你好，请简单介绍一下你自己。",
        parseSavedFailed: "无法解析保存的配置:",
        endpointRequired: "Endpoint 不能为空",
        endpointInvalid: "请输入有效的 URL，例如 https://api.openai.com/v1",
        enterConfigName: "请输入配置名称",
        updated: "配置已更新（API Key 不会保存）",
        saved: "配置已保存（API Key 不会保存）",
        loaded: "配置已加载，请重新输入 API Key",
        deleted: "配置已删除",
        unknownError: "未知错误，请查看控制台获取详细信息",
        errorPrefix: "错误",
        failedFetch: `网络请求失败 (Failed to fetch)，可能原因：
1. 跨域问题 (CORS) - 浏览器安全策略阻止了请求
2. Endpoint URL 格式不正确 - 请确保包含协议(http/https)和正确的端口
3. 网络连接问题 - 请检查您的网络连接
4. API 服务不可用 - 请确认服务是否在线
5. 防火墙或安全设置阻止了请求

建议解决方案:
- 使用支持 CORS 的 API 端点
- 使用代理服务器转发请求
- 检查网络连接
- 确认 API 端点是否可用`,
        unauthorized:
          "API Key 无效或未授权，请检查您的 API Key 是否正确，是否已过期，或是否有足够的权限",
        notFound:
          "API 路径不存在，请检查 Endpoint 是否正确。确保您的 API 端点支持 /chat/completions 路径",
        rateLimit:
          "请求过于频繁或超出配额限制，请稍后再试。您可能需要升级您的 API 计划或等待配额重置",
        dnsFailed: "Endpoint 域名无法解析，请检查域名是否正确拼写，或者 DNS 服务是否正常",
        refused: "Endpoint 连接被拒绝，请检查地址和端口是否正确。服务器可能未运行或不接受连接",
        networkCors:
          "网络错误，可能是由于跨域 (CORS) 限制导致，请确保 API 服务允许跨域请求，或考虑使用代理服务器",
        timeout: "请求超时，服务器响应时间过长。请检查网络连接或服务器负载，或增加超时时间",
        jsonError:
          "响应解析错误，服务器返回的不是有效的 JSON 格式。请检查 API 端点是否正确，或服务器是否返回了非 JSON 内容",
        required: "请填写所有必填参数",
        init: "初始化连接",
        apiTest: "API 连接测试",
        tokenUsage: "输入: {prompt} tokens, 输出: {completion} tokens, 总计: {total} tokens",
        noTokenUsage: "无 token 使用信息",
        successMessage: "连接成功，{tokens}",
        successToast: "OpenAI 接口连接成功",
        fetchFailureResponse:
          "请求失败: Failed to fetch\n\n请求 URL: {url}\n\n{message}",
        fetchFailureDetail: `网络请求失败 (Failed to fetch):

这可能是由于跨域 (CORS) 限制导致的。浏览器的安全策略阻止了从一个源访问另一个源的资源。

或者可能是网络连接问题，请检查您的网络连接是否正常。

请确保您的 Endpoint URL 格式正确，包含协议(http/https)和正确的端口。

如果您在使用代理，请确保代理配置正确。

请尝试以下解决方案:
1. 使用支持 CORS 的 API 端点
2. 使用代理服务器转发请求
3. 检查网络连接
4. 确认 API 端点是否可用`,
        failed: "连接失败: {message}",
        connectionTest: "连接测试",
        copied: "已复制到剪贴板",
        copyFailed: "复制失败",
        tabsConnection: "连接测试",
        tabsConfigs: "保存的配置（LocalStorage）",
        paramsTitle: "连接参数",
        paramsDesc: "请输入您的 OpenAI 兼容接口配置信息",
        copyEndpoint: "复制 API Endpoint",
        hideApiKey: "隐藏 API Key",
        showApiKey: "显示 API Key",
        copyApiKey: "复制 API Key",
        model: "模型",
        modelPlaceholder: "选择或输入模型名称",
        collapseModels: "收起模型列表",
        expandModels: "展开模型列表",
        customModel: "使用自定义模型名称",
        enabled: "启用",
        maxTokens: "最大 Tokens",
        useProxy: "使用代理（仅后端生效）",
        prompt: "测试提示词",
        promptPlaceholder: "输入测试提示词…",
        testing: "正在检测…",
        start: "开始检测",
        configName: "配置名称",
        saveConfig: "保存配置",
        saveHint:
          "保存配置会写入当前浏览器 localStorage，但不会保存 API Key。加载后请重新输入密钥。",
        resultsTitle: "测试结果",
        resultsDesc: "OpenAI 接口测试的详细结果",
        apiResponse: "API 响应:",
        copyResponse: "复制响应",
        troubleshooting: "常见问题排查：",
        troubleshootingItems: [
          "确保 API Endpoint URL 格式正确，包含协议（http:// 或 https://）",
          "检查 API Key 是否正确",
          "确认所选模型在您的 API 提供商中可用",
          "如果遇到跨域问题，需要在 API 服务端配置 CORS 策略",
          "检查网络连接是否正常，特别是在使用私有网络或 VPN 时",
          "如果使用第三方 API 服务，确认其是否完全兼容 OpenAI 接口",
        ],
        failedFetchTitle: "解决 \"Failed to fetch\" 错误：",
        failedFetchIntro:
          "这个错误通常是由于浏览器无法连接到 API 服务器导致的，常见原因包括：",
        failedFetchCauses: [
          { title: "跨域 (CORS) 限制", body: "浏览器的安全策略阻止了从一个源访问另一个源的资源" },
          { title: "网络连接问题", body: "您的网络可能无法访问 API 服务器" },
          { title: "API 端点不可用", body: "服务器可能已关闭或不接受连接" },
          { title: "防火墙或安全设置", body: "可能阻止了对 API 服务器的访问" },
        ],
        failedFetchSolutionsTitle: "可能的解决方案：",
        failedFetchSolutions: [
          {
            title: "使用代理服务器",
            body: "在服务器端发起请求可以绕过 CORS 限制",
            items: [
              "在本工具中启用“使用代理”选项（需要后端支持）",
              "或使用自己的代理服务器转发请求",
            ],
          },
          {
            title: "使用支持 CORS 的 API 端点",
            items: [
              "确认您的 API 提供商是否支持跨域请求",
              "如果您自己控制 API 服务器，添加适当的 CORS 头",
            ],
          },
          {
            title: "检查网络连接",
            items: [
              "尝试在浏览器中直接访问 API 端点（可能会返回 401 错误，但至少表明端点可达）",
              "检查您的网络是否有特殊限制或防火墙规则",
            ],
          },
          {
            title: "使用其他 API 客户端测试",
            items: [
              "使用 Postman、curl 或其他 API 工具测试连接",
              "如果其他工具可以连接，则问题可能是浏览器特定的",
            ],
          },
        ],
        savedConfigs: "已保存的配置",
        savedDescription: "加载、查看或管理您保存的 OpenAI 配置",
        noConfigs: "暂无保存的配置",
        load: "加载",
        delete: "删除",
        notSaved: "未保存，加载后需重新输入",
        disabled: "(未启用)",
        proxy: "使用代理:",
        yes: "是",
        no: "否",
        confirmDelete: "确认删除配置",
        confirmDeleteText: "将删除配置「{name}」。",
        irreversible: "此操作无法撤销。",
        cancel: "取消",
      };
  const [endpoint, setEndpoint] = useState("https://api.openai.com/v1");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-3.5-turbo");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [useTemperature, setUseTemperature] = useState(true);
  const [useMaxTokens, setUseMaxTokens] = useState(true);
  const [prompt, setPrompt] = useState(copy.defaultPrompt);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [useProxy, setUseProxy] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<
    { name: string; config: OpenAIConfig }[]
  >([]);
  const [configName, setConfigName] = useState("");
  const [endpointError, setEndpointError] = useState("");
  const [activeTab, setActiveTab] = useState<OpenAITab>("connection");
  const [showApiKey, setShowApiKey] = useState(false);
  const [copyState, setCopyState] = useState<{ [key: string]: boolean }>({});
  const [response, setResponse] = useState("");
  const [openModelSelector, setOpenModelSelector] = useState(false);
  const [modelInputValue, setModelInputValue] = useState("");
  const [deleteConfigIndex, setDeleteConfigIndex] = useState<number | null>(
    null
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTabChange = (value: string) => {
    const nextTab = OPENAI_TABS.includes(value as OpenAITab)
      ? (value as OpenAITab)
      : "connection";
    setActiveTab(nextTab);
    const url = new URL(window.location.href);
    if (nextTab === "connection") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", nextTab);
    }
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    setActiveTab(getInitialOpenAITab());
  }, []);

  // 从本地存储加载已保存的配置
  useEffect(() => {
    const configs = localStorage.getItem("openai-checker-configs");
    if (configs) {
      try {
        setSavedConfigs(JSON.parse(configs));
      } catch (e) {
        console.error(copy.parseSavedFailed, e);
      }
    }
  }, []);

  const validateEndpoint = (value: string) => {
    if (!value) {
      setEndpointError(copy.endpointRequired);
      return false;
    }

    try {
      // 检查是否是有效的 URL
      new URL(value);
      setEndpointError("");
      return true;
    } catch {
      setEndpointError(copy.endpointInvalid);
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
      toast.error(copy.enterConfigName);
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
        apiKey: "",
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
      toast.success(copy.updated);
    } else {
      // 不存在同名配置，添加新配置
      const newConfigs = [...savedConfigs, newConfig];
      setSavedConfigs(newConfigs);
      localStorage.setItem(
        "openai-checker-configs",
        JSON.stringify(newConfigs)
      );
      toast.success(copy.saved);
    }
    setConfigName("");
  };

  const loadConfig = (config: OpenAIConfig, configName?: string) => {
    // 清空之前的测试结果
    setTestResults([]);
    setResponse("");

    // 加载配置
    setEndpoint(config.endpoint || "https://api.openai.com/v1");
    setApiKey("");
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

    toast.success(copy.loaded);

    // 自动跳转到连接测试标签页
    handleTabChange("connection");
  };

  const confirmDeleteConfig = () => {
    if (deleteConfigIndex === null) return;
    const newConfigs = [...savedConfigs];
    newConfigs.splice(deleteConfigIndex, 1);
    setSavedConfigs(newConfigs);
    localStorage.setItem("openai-checker-configs", JSON.stringify(newConfigs));
    setDeleteConfigIndex(null);
    toast.success(copy.deleted);
  };

  const getErrorMessage = (error: OpenAIError): string => {
    console.error("详细错误信息:", error);

    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        return copy.failedFetch;
      }

      if (error.message.includes("401")) {
        return copy.unauthorized;
      }

      if (error.message.includes("404")) {
        return copy.notFound;
      }

      if (error.message.includes("429")) {
        return copy.rateLimit;
      }

      if (error.message.includes("ENOTFOUND")) {
        return copy.dnsFailed;
      }

      if (error.message.includes("ECONNREFUSED")) {
        return copy.refused;
      }

      if (error.message.includes("NetworkError")) {
        return copy.networkCors;
      }

      // 添加更多常见错误的处理
      if (
        error.message.includes("timeout") ||
        error.message.includes("timed out")
      ) {
        return copy.timeout;
      }

      if (error.message.includes("JSON")) {
        return copy.jsonError;
      }

      return `${error.name || copy.errorPrefix}: ${error.message}`;
    }

    return copy.unknownError;
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
      toast.error(copy.required);
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
      updateTestResults(copy.init, "pending");

      // 构建 API URL
      const apiUrl = `${endpoint.endsWith("/") ? endpoint.slice(0, -1) : endpoint}/chat/completions`;
      updateTestResults(copy.init, "success", `API URL: ${apiUrl}`);

      // 测试 API 连接
      try {
        updateTestResults(copy.apiTest, "pending");

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
            ? copy.tokenUsage
                .replace("{prompt}", String(data.usage.prompt_tokens || 0))
                .replace(
                  "{completion}",
                  String(data.usage.completion_tokens || 0)
                )
                .replace("{total}", String(data.usage.total_tokens || 0))
            : copy.noTokenUsage;

          updateTestResults(
            copy.apiTest,
            "success",
            copy.successMessage.replace("{tokens}", usedTokens),
            data
          );
          toast.success(copy.successToast);
        } catch (fetchError) {
          // 处理 fetch 错误
          if (
            fetchError instanceof TypeError &&
            fetchError.message.includes("Failed to fetch")
          ) {
            // 设置一个友好的错误消息
            const errorMsg = copy.fetchFailureDetail;

            setResponse(
              copy.fetchFailureResponse
                .replace("{url}", apiUrl)
                .replace("{message}", errorMsg)
            );
            updateTestResults(copy.apiTest, "error", errorMsg);
            throw new Error(errorMsg);
          }
          throw fetchError;
        }
      } catch (error) {
        const errorMsg = getErrorMessage(error);
        updateTestResults(copy.apiTest, "error", errorMsg);
        throw error;
      }
    } catch (error) {
      console.error("OpenAI 连接测试失败:", error);
      const errorMsg = getErrorMessage(error);
      toast.error(copy.failed.replace("{message}", errorMsg), {
        duration: 6000, // 增加显示时间
      });

      // 添加一个总体错误结果
      updateTestResults(copy.connectionTest, "error", errorMsg);
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

        toast.success(copy.copied);
      })
      .catch(err => {
        console.error(copy.copyFailed, err);
        toast.error(copy.copyFailed);
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
      { value: "qwen-turbo", label: isEnglish ? "Qwen Turbo" : "通义千问 Turbo" },
      { value: "qwen-plus", label: isEnglish ? "Qwen Plus" : "通义千问 Plus" },
      { value: "qwen-max", label: isEnglish ? "Qwen Max" : "通义千问 Max" },
      { value: "glm-4", label: isEnglish ? "Zhipu GLM-4" : "智谱 GLM-4" },
      {
        value: "glm-3-turbo",
        label: isEnglish ? "Zhipu GLM-3-Turbo" : "智谱 GLM-3-Turbo",
      },
    ],
    [isEnglish]
  );

  // 当选择预设模型时更新输入框的值
  useEffect(() => {
    const selectedOption = modelOptions.find(option => option.value === model);
    setModelInputValue(selectedOption ? selectedOption.label : model);
  }, [model, modelOptions]);

  return (
    <div className="flex flex-col gap-8 pb-8">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="max-w-4xl mx-auto w-full"
      >
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="connection">{copy.tabsConnection}</TabsTrigger>
          <TabsTrigger value="configs">{copy.tabsConfigs}</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{copy.paramsTitle}</CardTitle>
              <CardDescription>{copy.paramsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="openai-endpoint">
                  API Endpoint <span className="text-destructive">*</span>
                </Label>
                <div className="flex">
                  <Input
                    id="openai-endpoint"
                    name="endpoint"
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    spellCheck={false}
                    placeholder="https://api.openai.com/v1"
                    value={endpoint}
                    onChange={handleEndpointChange}
                    className={`${endpointError ? "border-destructive" : ""} flex-1`}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2"
                    onClick={() => copyToClipboard(endpoint, "endpoint")}
                    disabled={!endpoint}
                    aria-label={copy.copyEndpoint}
                  >
                    {copyState["endpoint"] ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {endpointError && (
                  <p className="text-sm text-destructive">{endpointError}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="openai-api-key">
                  API Key <span className="text-destructive">*</span>
                </Label>
                <div className="flex">
                  <Input
                    id="openai-api-key"
                    name="apiKey"
                    type={showApiKey ? "text" : "password"}
                    autoComplete="off"
                    spellCheck={false}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="flex-1"
                    placeholder="sk-…"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2"
                    onClick={() => setShowApiKey(!showApiKey)}
                    aria-label={
                      showApiKey ? copy.hideApiKey : copy.showApiKey
                    }
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
                    aria-label={copy.copyApiKey}
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
                <div className="flex flex-col gap-2">
                  <Label htmlFor="openai-model">
                    {copy.model} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <div className="flex">
                      <Input
                        id="openai-model"
                        name="model"
                        ref={inputRef}
                        value={modelInputValue}
                        onChange={e => setModelInputValue(e.target.value)}
                        placeholder={copy.modelPlaceholder}
                        autoComplete="off"
                        spellCheck={false}
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
                        aria-label={
                          openModelSelector
                            ? copy.collapseModels
                            : copy.expandModels
                        }
                        aria-expanded={openModelSelector}
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
                              {copy.customModel}
                            </Button>
                          </div>
                          {modelOptions.map(option => (
                            <button
                              type="button"
                              key={option.value}
                              role="option"
                              className={cn(
                                "w-full px-2 py-1.5 text-left text-sm rounded-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground",
                                model === option.value &&
                                  "bg-accent text-accent-foreground"
                              )}
                              aria-selected={model === option.value}
                              onClick={() => {
                                setModel(option.value);
                                setOpenModelSelector(false);
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="openai-temperature">
                      Temperature (0-2)
                    </Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="use-temperature"
                        checked={useTemperature}
                        onCheckedChange={setUseTemperature}
                      />
                      <Label
                        htmlFor="use-temperature"
                        className="text-xs text-muted-foreground"
                      >
                        {copy.enabled}
                      </Label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      id="openai-temperature"
                      name="temperature"
                      inputMode="decimal"
                      autoComplete="off"
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
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="openai-max-tokens">{copy.maxTokens}</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="use-max-tokens"
                        checked={useMaxTokens}
                        onCheckedChange={setUseMaxTokens}
                      />
                      <Label
                        htmlFor="use-max-tokens"
                        className="text-xs text-muted-foreground"
                      >
                        {copy.enabled}
                      </Label>
                    </div>
                  </div>
                  <Input
                    id="openai-max-tokens"
                    name="maxTokens"
                    type="number"
                    inputMode="numeric"
                    autoComplete="off"
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
                <div className="flex items-center pt-8 gap-2">
                  <Switch
                    id="use-proxy"
                    checked={useProxy}
                    onCheckedChange={setUseProxy}
                  />
                  <Label htmlFor="use-proxy">{copy.useProxy}</Label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="openai-prompt">{copy.prompt}</Label>
                <Textarea
                  id="openai-prompt"
                  name="prompt"
                  placeholder={copy.promptPlaceholder}
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
                  {isTesting ? copy.testing : copy.start}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <div className="flex items-center w-full gap-2">
                <Input
                  id="openai-config-name"
                  name="configName"
                  autoComplete="off"
                  placeholder={copy.configName}
                  value={configName}
                  onChange={e => setConfigName(e.target.value)}
                />
                <Button onClick={saveConfig} disabled={!configName.trim()}>
                  <Save data-icon="inline-start" />
                  {copy.saveConfig}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground w-full">
                {copy.saveHint}
              </p>
            </CardFooter>
          </Card>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{copy.resultsTitle}</CardTitle>
                <CardDescription>{copy.resultsDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {testResults.map((result, index) => (
                    <div key={index}>
                      <Alert
                        className={
                          result.status === "success"
                            ? "border-success bg-success-muted"
                            : result.status === "error"
                              ? "border-destructive bg-destructive/10"
                              : "border-warning bg-warning-muted"
                        }
                      >
                        {result.status === "success" && (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        )}
                        {result.status === "error" && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        {result.status === "pending" && (
                          <div className="h-4 w-4 rounded-full border-2 border-warning border-t-transparent animate-spin" />
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
                    <div className="font-medium mb-2">{copy.apiResponse}</div>
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
                          <Check data-icon="inline-start" />
                        ) : (
                          <Copy data-icon="inline-start" />
                        )}
                        {copy.copyResponse}
                      </Button>
                    </div>
                  </div>
                )}

                {testResults.some(r => r.status === "error") && (
                  <div className="mt-4 p-4 border border-warning rounded-md bg-warning-muted">
                    <h3 className="font-medium mb-2">
                      {copy.troubleshooting}
                    </h3>
                    <ul className="flex flex-col list-disc pl-5 text-sm gap-1">
                      {copy.troubleshootingItems.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>

                    {testResults.some(r =>
                      r.message?.includes("Failed to fetch")
                    ) && (
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">
                          {copy.failedFetchTitle}
                        </h3>
                        <div className="bg-muted p-3 rounded-md border border-border text-sm">
                          <p className="mb-2 font-medium">
                            {copy.failedFetchIntro}
                          </p>
                          <ol className="flex flex-col list-decimal pl-5 gap-1">
                            {copy.failedFetchCauses.map(item => (
                              <li key={item.title}>
                                <span className="font-medium">
                                  {item.title}
                                </span>{" "}
                                - {item.body}
                              </li>
                            ))}
                          </ol>

                          <p className="mt-3 mb-2 font-medium">
                            {copy.failedFetchSolutionsTitle}
                          </p>
                          <ol className="flex flex-col list-decimal pl-5 gap-1">
                            {copy.failedFetchSolutions.map(item => (
                              <li key={item.title}>
                                <span className="font-medium">
                                  {item.title}
                                </span>
                                {item.body ? <> - {item.body}</> : null}
                                <ul className="list-disc pl-5 mt-1 text-xs">
                                  {item.items.map(child => (
                                    <li key={child}>{child}</li>
                                  ))}
                                </ul>
                              </li>
                            ))}
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
              <CardTitle>{copy.savedConfigs}</CardTitle>
              <CardDescription>{copy.savedDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              {savedConfigs.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  {copy.noConfigs}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {savedConfigs.map((item, index) => (
                    <div
                      key={index}
                      className="border rounded-md overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-3 bg-muted/30">
                        <div className="font-medium">{item.name}</div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadConfig(item.config, item.name)}
                          >
                            <Upload data-icon="inline-start" />
                            {copy.load}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteConfigIndex(index)}
                          >
                            <X data-icon="inline-start" />
                            {copy.delete}
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col p-3 text-sm bg-muted/10 gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">Endpoint:</span>
                            <span className="ml-1 break-all">
                              {item.config.endpoint}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">{copy.model}:</span>
                            <span className="ml-1">
                              {modelOptions.find(
                                option => option.value === item.config.model
                              )?.label || item.config.model}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">API Key:</span>
                          <span className="ml-1 text-muted-foreground">
                            {copy.notSaved}
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
                                {copy.disabled}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">
                              {copy.maxTokens}:
                            </span>
                            <span className="ml-1">
                              {item.config.maxTokens}
                            </span>
                            {item.config.useMaxTokens === false && (
                              <span className="ml-1 text-muted-foreground">
                                {copy.disabled}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">{copy.proxy}</span>
                          <span className="ml-1">
                            {item.config.useProxy ? copy.yes : copy.no}
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

      <AlertDialog
        open={deleteConfigIndex !== null}
        onOpenChange={open => !open && setDeleteConfigIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfigIndex !== null && (
                <>
                  {copy.confirmDeleteText.replace(
                    "{name}",
                    savedConfigs[deleteConfigIndex]?.name || ""
                  )}
                  <span className="text-destructive">{copy.irreversible}</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteConfig}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {copy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
