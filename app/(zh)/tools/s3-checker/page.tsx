"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { checkS3ConnectionServer } from "./actions";
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  _Object as S3Object,
} from "@aws-sdk/client-s3";
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
  ChevronDown,
  ChevronUp,
  Info,
  Server,
  Globe,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import type { TestResult, S3Config, SavedConfig, CopyState } from "./types";
import {
  formatFileSize,
  getErrorMessage,
  extractErrorDetails,
  validateEndpoint,
  getEndpointError,
} from "./utils";
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

type S3CheckerTab = "connection" | "configs";
const S3_CHECKER_TABS: S3CheckerTab[] = ["connection", "configs"];
function getInitialS3CheckerTab(): S3CheckerTab {
  if (typeof window === "undefined") return "connection";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return S3_CHECKER_TABS.includes(tab as S3CheckerTab)
    ? (tab as S3CheckerTab)
    : "connection";
}

export default function S3CheckerPage() {
  const locale = useLocale();
  const isEnglish = locale === englishLocale;
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  });
  const copy = isEnglish
    ? {
        parseSavedFailed: "Could not parse saved configs:",
        enterConfigName: "Enter a config name.",
        updated: "Config updated. Secret Key is not saved.",
        saved: "Config saved. Secret Key is not saved.",
        loaded: "Config loaded. Re-enter Secret Key.",
        deleted: "Config deleted",
        required: "Fill in all required parameters.",
        serverSuccess: "S3 server-side connection test passed.",
        serverPartial:
          "Some S3 server-side checks failed. Review the details.",
        serverCallFailed: "Server-side test call failed:",
        serverCallFailedToast: "Server-side test failed. Check network or logs.",
        init: "Initialize connection",
        initSuccess: "Client initialized",
        cors: "CORS check",
        corsHint:
          "Testing in browser security mode. If connection fails, switch to server proxy mode.",
        bucketTest: "Bucket connection test",
        bucketSuccess: "Bucket exists and is reachable",
        endpointRootCause:
          "Endpoint may be incorrect. Use only protocol and domain, such as https://oss-cn-hangzhou.aliyuncs.com. Do not include bucket name or sub-path.",
        endpointPathError: "Connection failed: endpoint may include extra path",
        skipped: "\n\nSkipped this step and continued with later checks...",
        listTest: "List permission test",
        listSuccess: "List permission verified",
        filesFound: ", found {count} files",
        bucketEmpty: ", bucket is empty",
        writeTest: "Write permission test",
        testContent: "S3 connectivity test file",
        writeSuccess: "Write permission verified",
        readTest: "Read permission test",
        readSuccess: "Read permission verified",
        deleteTest: "Delete permission test",
        deleteSuccess: "Delete permission verified",
        pathTest: "Path access test",
        pathSuccess: 'Path "{path}" access succeeded',
        pathEmpty: ", path is empty",
        clientSuccess: "S3 connection succeeded and permissions verified.",
        clientPartial: "Some S3 checks failed. Review detailed results.",
        connectionFailed: "Connection failed:",
        connectionTest: "Connection test",
        copied: "Copied to clipboard",
        copyFailed: "Copy failed",
        connectionTab: "Connection test",
        configsTab: "Config management",
        paramsTitle: "Connection parameters",
        paramsDescription: "Enter your S3-compatible storage configuration.",
        bucket: "Bucket name",
        checkPath: "Check path (optional)",
        testMode: "Test mode",
        serverProxy: "Server proxy mode",
        recommended: "Recommended",
        serverProxyDesc:
          "Proxy requests through the server to avoid browser CORS limits. More stable and safer.",
        clientMode: "Client direct mode",
        clientModeDesc:
          "requires your S3 service to allow this site in its CORS policy.",
        clientModeHint:
          "If network requests fail or the console reports CORS errors, switch back to Server proxy mode.",
        advanced: "Advanced options",
        collapse: "Collapse",
        expand: "Expand",
        region: "Region (optional)",
        pathStyle: "Use path-style access",
        pathStyleOff: "Off (default):",
        pathStyleOn: "On:",
        pathStyleOffDesc: "For AWS S3, Alibaba Cloud OSS, Tencent Cloud COS",
        pathStyleOnDesc: "For MinIO, Ceph RGW, and self-hosted S3-compatible services",
        testing: "Testing...",
        start: "Start test",
        saveConfig: "Save config",
        configNamePlaceholder: "Config name (required to save)",
        saveHint:
          "Saved configs are stored in this browser's localStorage, but Secret Key is not saved. Re-enter it after loading.",
        resultsTitle: "Test results",
        resultsDescription: "Detailed S3 API test results",
        hide: "Hide",
        showTech: "Show technical details",
        fileList: "File list:",
        fileName: "File name",
        size: "Size",
        lastModified: "Last modified",
        troubleshooting: "Common troubleshooting:",
        troubleshootingItems: [
          "Ensure the Endpoint URL is correct and includes protocol (http:// or https://).",
          "Check whether Access Key and Secret Key are correct.",
          "Confirm the bucket name is spelled correctly and exists.",
          "If CORS errors occur, configure the CORS policy on the S3 service.",
          "Check network connectivity, especially when using private networks or VPN.",
          'Try toggling "Use path-style access".',
        ],
        savedConfigs: "Saved configs",
        savedDescription: "Load, inspect, or manage saved S3 configs.",
        noConfigs: "No saved configs",
        load: "Load",
        delete: "Delete",
        path: "Path:",
        usePathStyle: "Path style:",
        yes: "Yes",
        no: "No",
        confirmDelete: "Delete config?",
        confirmDeleteText: 'Delete config "{name}"?',
        irreversible: "This action cannot be undone.",
        cancel: "Cancel",
        confirmDeleteButton: "Delete",
        copyEndpoint: "Copy Endpoint",
        showAccess: "Show Access Key",
        hideAccess: "Hide Access Key",
        copyAccess: "Copy Access Key",
        showSecret: "Show Secret Key",
        hideSecret: "Hide Secret Key",
        copySecret: "Copy Secret Key",
        copyBucket: "Copy bucket name",
      }
    : {
        parseSavedFailed: "无法解析保存的配置:",
        enterConfigName: "请输入配置名称",
        updated: "配置已更新（Secret Key 不会保存）",
        saved: "配置已保存（Secret Key 不会保存）",
        loaded: "配置已加载，请重新输入 Secret Key",
        deleted: "配置已删除",
        required: "请填写所有必填参数",
        serverSuccess: "S3 服务端连接测试通过！",
        serverPartial: "S3 服务端连接测试存在失败项，请检查详情。",
        serverCallFailed: "服务端测试调用失败:",
        serverCallFailedToast: "服务端测试调用失败，请检查网络或日志",
        init: "初始化连接",
        initSuccess: "客户端初始化成功",
        cors: "CORS 检测",
        corsHint: "浏览器安全模式下进行测试，如遇连接失败请切换到服务端代理模式",
        bucketTest: "Bucket连接测试",
        bucketSuccess: "Bucket 连接正常且存在",
        endpointRootCause:
          "Endpoint 格式可能不正确。请确保 Endpoint 仅包含协议和域名（如 https://oss-cn-hangzhou.aliyuncs.com），不要包含 Bucket 名称或子路径。",
        endpointPathError: "连接失败：Endpoint 可能包含多余路径",
        skipped: "\n\n⚠️ 已跳过此步骤，继续后续测试...",
        listTest: "列表权限测试",
        listSuccess: "列表权限验证通过",
        filesFound: "，获取到 {count} 个文件",
        bucketEmpty: "，存储桶为空",
        writeTest: "写入权限测试",
        testContent: "S3接口连通性测试文件",
        writeSuccess: "写入权限验证通过",
        readTest: "读取权限测试",
        readSuccess: "读取权限验证通过",
        deleteTest: "删除权限测试",
        deleteSuccess: "删除权限验证通过",
        pathTest: "路径访问测试",
        pathSuccess: "路径 \"{path}\" 访问成功",
        pathEmpty: "，路径为空",
        clientSuccess: "S3 接口连接成功，权限验证通过",
        clientPartial: "S3 接口测试部分失败，请查看详细结果",
        connectionFailed: "连接失败:",
        connectionTest: "连接测试",
        copied: "已复制到剪贴板",
        copyFailed: "复制失败",
        connectionTab: "连接测试",
        configsTab: "配置管理",
        paramsTitle: "连接参数",
        paramsDescription: "请输入您的S3兼容存储服务配置信息",
        bucket: "存储桶名称",
        checkPath: "检测路径（可选）",
        testMode: "测试模式",
        serverProxy: "服务端代理模式",
        recommended: "推荐",
        serverProxyDesc: "通过服务端转发请求，避免浏览器 CORS 跨域限制。更稳定、更安全。",
        clientMode: "客户端直连模式",
        clientModeDesc: "要求您的 S3 服务已配置 CORS 策略允许此网站访问。",
        clientModeHint: "如遇网络请求失败或控制台报 CORS 错误，请切换回「服务端代理模式」",
        advanced: "高级选项",
        collapse: "收起",
        expand: "展开",
        region: "区域（可选）",
        pathStyle: "使用路径风格访问",
        pathStyleOff: "关闭（默认）：",
        pathStyleOn: "开启：",
        pathStyleOffDesc: "适用于 AWS S3、阿里云 OSS、腾讯云 COS",
        pathStyleOnDesc: "适用于 MinIO、Ceph RGW、自建 S3 兼容服务",
        testing: "正在检测…",
        start: "开始检测",
        saveConfig: "保存配置",
        configNamePlaceholder: "配置名称（保存时填写）",
        saveHint: "保存配置会写入当前浏览器 localStorage，但不会保存 Secret Key。加载后请重新输入密钥。",
        resultsTitle: "测试结果",
        resultsDescription: "S3 接口测试的详细结果",
        hide: "隐藏",
        showTech: "查看技术详情",
        fileList: "文件列表：",
        fileName: "文件名",
        size: "大小",
        lastModified: "最后修改时间",
        troubleshooting: "常见问题排查：",
        troubleshootingItems: [
          "确保 Endpoint URL 格式正确，包含协议（http:// 或 https://）",
          "检查 Access Key 和 Secret Key 是否正确",
          "确认存储桶名称拼写正确且存在",
          "如果遇到跨域问题，需要在 S3 服务端配置 CORS 策略",
          "检查网络连接是否正常，特别是在使用私有网络或 VPN 时",
          "尝试切换“使用路径风格访问”选项",
        ],
        savedConfigs: "已保存的配置",
        savedDescription: "加载、查看或管理您保存的 S3 配置",
        noConfigs: "暂无保存的配置",
        load: "加载",
        delete: "删除",
        path: "路径:",
        usePathStyle: "路径风格:",
        yes: "是",
        no: "否",
        confirmDelete: "确认删除配置",
        confirmDeleteText: "确定要删除配置「{name}」吗？",
        irreversible: "此操作无法撤销。",
        cancel: "取消",
        confirmDeleteButton: "确认删除",
        copyEndpoint: "复制 Endpoint",
        showAccess: "显示 Access Key",
        hideAccess: "隐藏 Access Key",
        copyAccess: "复制 Access Key",
        showSecret: "显示 Secret Key",
        hideSecret: "隐藏 Secret Key",
        copySecret: "复制 Secret Key",
        copyBucket: "复制存储桶名称",
      };
  const [endpoint, setEndpoint] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [bucket, setBucket] = useState("");
  const [path, setPath] = useState("");
  const [region, setRegion] = useState("auto");
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [usePathStyle, setUsePathStyle] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [configName, setConfigName] = useState("");
  const [endpointError, setEndpointError] = useState("");
  const [activeTab, setActiveTab] = useState<S3CheckerTab>("connection");
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>({});
  const [useServerProxy, setUseServerProxy] = useState(true);
  const [showPathStyleDetails, setShowPathStyleDetails] = useState(false);
  const [deleteConfigIndex, setDeleteConfigIndex] = useState<number | null>(
    null
  );

  const handleTabChange = (value: string) => {
    const nextTab = S3_CHECKER_TABS.includes(value as S3CheckerTab)
      ? (value as S3CheckerTab)
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
    setActiveTab(getInitialS3CheckerTab());
  }, []);

  const [expandedErrorDetails, setExpandedErrorDetails] = useState<Set<number>>(
    new Set()
  );

  // 从本地存储加载已保存的配置
  useEffect(() => {
    const configs = localStorage.getItem("s3-checker-configs");
    if (configs) {
      try {
        setSavedConfigs(JSON.parse(configs));
      } catch (e) {
        console.error(copy.parseSavedFailed, e);
      }
    }
  }, []);

  const validateEndpointInput = (value: string) => {
    if (!validateEndpoint(value)) {
      setEndpointError(getEndpointError(value, locale));
      return false;
    }
    setEndpointError("");
    return true;
  };

  const handleEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndpoint(value);
    if (value) validateEndpointInput(value);
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
        accessKey,
        secretKey: "",
        bucket,
        path,
        region,
        usePathStyle,
      },
    };

    if (existingIndex >= 0) {
      // 存在同名配置，进行覆盖
      const newConfigs = [...savedConfigs];
      newConfigs[existingIndex] = newConfig;
      setSavedConfigs(newConfigs);
      localStorage.setItem("s3-checker-configs", JSON.stringify(newConfigs));
      toast.success(copy.updated);
    } else {
      // 不存在同名配置，添加新配置
      const newConfigs = [...savedConfigs, newConfig];
      setSavedConfigs(newConfigs);
      localStorage.setItem("s3-checker-configs", JSON.stringify(newConfigs));
      toast.success(copy.saved);
    }
    setConfigName("");
  };

  const loadConfig = (config: S3Config, configName?: string) => {
    // 清空之前的测试结果
    setTestResults([]);

    // 加载配置
    setEndpoint(config.endpoint || "");
    setAccessKey(config.accessKey || "");
    setSecretKey("");
    setBucket(config.bucket || "");
    setPath(config.path || "");
    setRegion(config.region || "auto");
    setUsePathStyle(
      config.usePathStyle !== undefined ? config.usePathStyle : false
    );

    // 如果提供了配置名称，则设置配置名称以便覆盖
    if (configName) {
      setConfigName(configName);
    }

    toast.success(copy.loaded);

    // 自动跳转到连接测试标签页
    handleTabChange("connection");
  };

  const deleteConfig = (index: number) => {
    setDeleteConfigIndex(index);
  };

  const confirmDeleteConfig = () => {
    if (deleteConfigIndex === null) return;

    const newConfigs = [...savedConfigs];
    newConfigs.splice(deleteConfigIndex, 1);
    setSavedConfigs(newConfigs);
    localStorage.setItem("s3-checker-configs", JSON.stringify(newConfigs));
    toast.success(copy.deleted);
    setDeleteConfigIndex(null);
  };

  const toggleErrorDetails = (index: number) => {
    setExpandedErrorDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const updateTestResults = (
    step: string,
    status: "success" | "error" | "pending",
    message?: string,
    data?: S3Object[],
    errorDetails?: Record<string, string>
  ) => {
    setTestResults(prev => {
      const existing = prev.findIndex(r => r.step === step);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { step, status, message, data, errorDetails };
        return updated;
      }
      return [...prev, { step, status, message, data, errorDetails }];
    });
  };

  const validateS3Connection = async () => {
    if (!endpoint || !accessKey || !secretKey || !bucket) {
      toast.error(copy.required);
      return;
    }

    if (!validateEndpointInput(endpoint)) {
      return;
    }

    setIsTesting(true);
    setTestResults([]);

    if (useServerProxy) {
      try {
        const results = await checkS3ConnectionServer({
          endpoint,
          accessKey,
          secretKey,
          bucket,
          path: path || "",
          region,
          usePathStyle,
          locale,
        });
        setTestResults(results);

        const hasError = results.some(r => r.status === "error");
        if (!hasError) {
          toast.success(copy.serverSuccess);
        } else {
          toast.error(copy.serverPartial);
        }
      } catch (error) {
        console.error(copy.serverCallFailed, error);
        toast.error(copy.serverCallFailedToast);
      } finally {
        setIsTesting(false);
      }
      return;
    }

    let hasStepError = false;

    try {
      // 初始化 S3 客户端
      updateTestResults(copy.init, "pending");
      const s3Client = new S3Client({
        endpoint,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        forcePathStyle: usePathStyle,
        region: region || "auto",
      });
      updateTestResults(copy.init, "success", copy.initSuccess);

      // 添加 CORS 预检测提示
      updateTestResults(
        copy.cors,
        "success",
        copy.corsHint
      );

      // Bucket连接可用性测试（可选步骤，失败不影响后续测试）
      try {
        updateTestResults(copy.bucketTest, "pending");
        await s3Client.send(
          new HeadBucketCommand({
            Bucket: bucket,
          })
        );
        updateTestResults(copy.bucketTest, "success", copy.bucketSuccess);
      } catch (error) {
        const errorMsg = getErrorMessage(error, bucket, endpoint, locale);
        const details = extractErrorDetails(error, endpoint, locale);

        // 特殊处理 NoSuchKey：在 HeadBucket 中出现通常意味着 Endpoint 包含了路径
        if (
          details["Code"] === "NoSuchKey" ||
          (error as any).name === "NoSuchKey"
        ) {
          details["Possible Root Cause"] =
            copy.endpointRootCause;
          updateTestResults(
            copy.bucketTest,
            "error",
            copy.endpointPathError,
            undefined,
            details
          );
        } else {
          // HEAD 请求失败可能是因为 CORS 或认证问题，但继续后续测试
          updateTestResults(
            copy.bucketTest,
            "error",
            errorMsg + copy.skipped,
            undefined,
            details
          );
        }
        // 不抛出错误，继续执行后续测试
      }

      // 测试列表对象权限
      try {
        updateTestResults(copy.listTest, "pending");
        const listResult = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            MaxKeys: 10,
          })
        );

        // 格式化列表数据
        const fileList = listResult.Contents || [];
        let resultMessage = copy.listSuccess;

        if (fileList.length > 0) {
          resultMessage += copy.filesFound.replace(
            "{count}",
            String(fileList.length)
          );
        } else {
          resultMessage += copy.bucketEmpty;
        }

        updateTestResults(copy.listTest, "success", resultMessage, fileList);
      } catch (error) {
        hasStepError = true;
        const errorMsg = getErrorMessage(error, bucket, endpoint, locale);
        updateTestResults(
          copy.listTest,
          "error",
          errorMsg,
          undefined,
          extractErrorDetails(error, endpoint, locale)
        );
        // 不抛出错误，继续进行写入测试，以支持“只写”场景
      }

      // 测试写入权限（创建测试文件）
      try {
        updateTestResults(copy.writeTest, "pending");
        const testKey = `test-${Date.now()}.txt`;
        const testContent = copy.testContent;
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: testKey,
            Body: testContent,
            ContentType: "text/plain",
          })
        );
        updateTestResults(copy.writeTest, "success", copy.writeSuccess);

        // 测试读取权限（读取刚才写入的文件）
        try {
          updateTestResults(copy.readTest, "pending");
          const getResult = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucket,
              Key: testKey,
            })
          );

          // 验证读取内容（简单验证 status 即可，流读取较复杂且非必要）
          if (getResult.$metadata.httpStatusCode === 200) {
            updateTestResults(copy.readTest, "success", copy.readSuccess);
          } else {
            throw new Error(
              `HTTP Status: ${getResult.$metadata.httpStatusCode}`
            );
          }
        } catch (error) {
          // 读取失败不影响后续删除
          updateTestResults(
            copy.readTest,
            "error",
            getErrorMessage(error, bucket, endpoint, locale),
            undefined,
            extractErrorDetails(error, endpoint, locale)
          );
        }

        // 清理测试文件
        try {
          updateTestResults(copy.deleteTest, "pending");
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: testKey,
            })
          );
          updateTestResults(copy.deleteTest, "success", copy.deleteSuccess);
        } catch (error) {
          // 删除失败不中断流程，也不标记为关键步骤错误，但记录错误
          updateTestResults(
            copy.deleteTest,
            "error",
            getErrorMessage(error, bucket, endpoint, locale),
            undefined,
            extractErrorDetails(error, endpoint, locale)
          );
          // 不抛出错误，因为这不是关键测试
        }
      } catch (error) {
        hasStepError = true;
        updateTestResults(
          copy.writeTest,
          "error",
          getErrorMessage(error, bucket, endpoint, locale),
          undefined,
          extractErrorDetails(error, endpoint, locale)
        );
        // 不抛出错误，继续测试其他功能
      }

      // 测试指定路径访问
      if (path) {
        try {
          updateTestResults(copy.pathTest, "pending");
          const pathResult = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: bucket,
              Prefix: path,
              MaxKeys: 10,
            })
          );

          // 格式化路径列表数据
          const pathFiles = pathResult.Contents || [];
          let pathMessage = copy.pathSuccess.replace("{path}", path);

          if (pathFiles.length > 0) {
            pathMessage += copy.filesFound.replace(
              "{count}",
              String(pathFiles.length)
            );
          } else {
            pathMessage += copy.pathEmpty;
          }

          updateTestResults(copy.pathTest, "success", pathMessage, pathFiles);
        } catch (error) {
          // 路径测试失败不标记为 hasStepError，避免阻止后续流程（虽然这里已经是最后了）
          // 或者如果是可选测试，就不应该算作“阻断性错误”
          updateTestResults(
            copy.pathTest,
            "error",
            getErrorMessage(error, bucket, endpoint, locale),
            undefined,
            extractErrorDetails(error, endpoint, locale)
          );
          // 不抛出错误，因为这是可选测试
        }
      }

      // 检查是否有任何错误
      const hasErrors =
        testResults.some(result => result.status === "error") || hasStepError;
      if (!hasErrors) {
        toast.success(copy.clientSuccess);
      } else {
        toast.error(copy.clientPartial);
      }
    } catch (error) {
      console.error("S3 连接测试失败:", error);
      const errorMsg = getErrorMessage(error, bucket, endpoint, locale);
      toast.error(`${copy.connectionFailed} ${errorMsg}`, {
        duration: 6000, // 增加显示时间
      });

      // 只有在没有具体步骤报错的情况下，才添加总体错误结果
      if (!hasStepError) {
        updateTestResults(
          copy.connectionTest,
          "error",
          errorMsg,
          undefined,
          extractErrorDetails(error, endpoint, locale)
        );
      }
    } finally {
      setIsTesting(false);
    }
  };

  // 复制文本到剪贴板
  const copyToClipboard = useCallback((text: string, field: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // 设置复制状态为成功
        setCopyState(prev => ({ ...prev, [field]: true }));

        // 2秒后重置状态（使用函数式更新避免闭包陷阱）
        setTimeout(() => {
          setCopyState(prev => ({ ...prev, [field]: false }));
        }, 2000);

        toast.success(copy.copied);
      })
      .catch(err => {
        console.error(copy.copyFailed, err);
        toast.error(copy.copyFailed);
      });
  }, [copy.copied, copy.copyFailed]);

  return (
    <div className="flex flex-col gap-8 pb-8">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="max-w-4xl mx-auto w-full"
      >
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="connection">{copy.connectionTab}</TabsTrigger>
          <TabsTrigger value="configs">{copy.configsTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{copy.paramsTitle}</CardTitle>
              <CardDescription>{copy.paramsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {/* 连接参数 */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">{copy.paramsTitle}</h3>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="s3-endpoint">
                    Endpoint <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex">
                    <Input
                      id="s3-endpoint"
                      name="endpoint"
                      type="url"
                      inputMode="url"
                      autoComplete="url"
                      spellCheck={false}
                      placeholder="https://your-s3-endpoint.com"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="s3-access-key">
                      Access Key <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex">
                      <Input
                        id="s3-access-key"
                        name="accessKey"
                        type={showAccessKey ? "text" : "password"}
                        autoComplete="off"
                        spellCheck={false}
                        value={accessKey}
                        onChange={e => setAccessKey(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2"
                        onClick={() => setShowAccessKey(!showAccessKey)}
                        aria-label={
                          showAccessKey ? copy.hideAccess : copy.showAccess
                        }
                      >
                        {showAccessKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2"
                        onClick={() => copyToClipboard(accessKey, "accessKey")}
                        disabled={!accessKey}
                        aria-label={copy.copyAccess}
                      >
                        {copyState["accessKey"] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="s3-secret-key">
                      Secret Key <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex">
                      <Input
                        id="s3-secret-key"
                        name="secretKey"
                        type={showSecretKey ? "text" : "password"}
                        autoComplete="off"
                        spellCheck={false}
                        value={secretKey}
                        onChange={e => setSecretKey(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        aria-label={
                          showSecretKey ? copy.hideSecret : copy.showSecret
                        }
                      >
                        {showSecretKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2"
                        onClick={() => copyToClipboard(secretKey, "secretKey")}
                        disabled={!secretKey}
                        aria-label={copy.copySecret}
                      >
                        {copyState["secretKey"] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 存储桶和路径 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="s3-bucket">
                      {copy.bucket} <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex">
                      <Input
                        id="s3-bucket"
                        name="bucket"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="bucket-name"
                        value={bucket}
                        onChange={e => setBucket(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2"
                        onClick={() => copyToClipboard(bucket, "bucket")}
                        disabled={!bucket}
                        aria-label={copy.copyBucket}
                      >
                        {copyState["bucket"] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="s3-path">{copy.checkPath}</Label>
                    <Input
                      id="s3-path"
                      name="path"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="path/to/check"
                      value={path}
                      onChange={e => setPath(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 测试模式选择 */}
              <div className="flex flex-col p-4 bg-muted/30 rounded-lg border gap-4">
                <div className="flex items-center gap-2 pb-2">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">{copy.testMode}</h3>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-start p-3 bg-background rounded-md border-2 border-primary/20 gap-3">
                    <Switch
                      id="use-server-proxy"
                      checked={useServerProxy}
                      onCheckedChange={setUseServerProxy}
                      className="mt-1"
                    />
                    <div className="flex flex-col flex-1 gap-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="use-server-proxy"
                          className="font-semibold cursor-pointer"
                        >
                          {copy.serverProxy}
                        </Label>
                        <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded-full font-medium">
                          {copy.recommended}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {copy.serverProxyDesc}
                      </p>
                    </div>
                  </div>

                  {!useServerProxy && (
                    <div className="p-3 bg-warning-muted rounded-md border border-warning/30">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-warning-foreground">
                            <span className="font-semibold">
                              {copy.clientMode}
                            </span>
                            {copy.clientModeDesc}
                          </p>
                          <p className="text-xs text-warning-foreground mt-1">
                            {copy.clientModeHint}
                            <span className="font-semibold">
                              {" "}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 高级选项 */}
              <div className="flex flex-col gap-4">
                <Collapsible
                  open={showPathStyleDetails}
                  onOpenChange={setShowPathStyleDetails}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 pb-2">
                      <Info className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">{copy.advanced}</h3>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1">
                        {showPathStyleDetails ? (
                          <>
                            <span>{copy.collapse}</span>
                            <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            <span>{copy.expand}</span>
                            <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="flex flex-col pt-4 gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label>{copy.region}</Label>
                        <Input
                          placeholder="auto"
                          value={region}
                          onChange={e => setRegion(e.target.value)}
                        />
                      </div>
                      <div className="flex items-start pt-6 gap-2">
                        <Switch
                          id="path-style"
                          checked={usePathStyle}
                          onCheckedChange={setUsePathStyle}
                          className="mt-1"
                        />
                        <div className="flex flex-col flex-1 gap-1">
                          <Label
                            htmlFor="path-style"
                            className="cursor-pointer"
                          >
                            {copy.pathStyle}
                          </Label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-medium">
                              {copy.pathStyleOff}
                            </span>
                            {copy.pathStyleOffDesc}
                            <br />
                            <span className="font-medium">
                              {copy.pathStyleOn}
                            </span>
                            {copy.pathStyleOnDesc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col pt-2 border-t gap-3">
                <div className="flex gap-2">
                  <Button
                    onClick={validateS3Connection}
                    className="flex-1"
                    disabled={isTesting}
                  >
                    {isTesting ? copy.testing : copy.start}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={saveConfig}
                    disabled={!configName.trim()}
                    className="min-w-[120px]"
                  >
                    <Save data-icon="inline-start" />
                    {copy.saveConfig}
                  </Button>
                </div>
                <Input
                  placeholder={copy.configNamePlaceholder}
                  value={configName}
                  onChange={e => setConfigName(e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {copy.saveHint}
                </p>
              </div>
            </CardContent>
          </Card>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{copy.resultsTitle}</CardTitle>
                <CardDescription>{copy.resultsDescription}</CardDescription>
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
                        {result.status === "error" &&
                          result.errorDetails &&
                          Object.keys(result.errorDetails).length > 0 && (
                            <Collapsible
                              open={expandedErrorDetails.has(index)}
                              onOpenChange={() => toggleErrorDetails(index)}
                            >
                              <div className="mt-2">
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 h-7 text-xs"
                                  >
                                    {expandedErrorDetails.has(index) ? (
                                      <>
                                        <span>{copy.hide}</span>
                                        <ChevronUp className="h-3 w-3" />
                                      </>
                                    ) : (
                                      <>
                                        <span>{copy.showTech}</span>
                                        <ChevronDown className="h-3 w-3" />
                                      </>
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <div className="text-xs bg-white/50 dark:bg-black/20 p-2 rounded overflow-auto border border-destructive/30">
                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                                      {Object.entries(result.errorDetails).map(
                                        ([key, value]) => (
                                          <div key={key} className="contents">
                                            <span className="text-muted-foreground whitespace-nowrap">
                                              {key}:
                                            </span>
                                            <span className="font-mono select-all break-all">
                                              {value}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          )}
                      </Alert>

                      {/* 显示文件列表数据 */}
                      {result.status === "success" &&
                        result.data &&
                        Array.isArray(result.data) &&
                        result.data.length > 0 && (
                          <div className="mt-2 mb-4 overflow-x-auto">
                            <div className="text-sm font-medium mb-1">
                              {copy.fileList}
                            </div>
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-muted/50">
                                  <th className="p-2 text-left border">
                                    {copy.fileName}
                                  </th>
                                  <th className="p-2 text-left border">
                                    {copy.size}
                                  </th>
                                  <th className="p-2 text-left border">
                                    {copy.lastModified}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.data.map(
                                  (file: S3Object, fileIndex: number) => (
                                    <tr key={fileIndex} className="border-b">
                                      <td className="p-2 border break-all">
                                        {file.Key}
                                      </td>
                                      <td className="p-2 border whitespace-nowrap">
                                        {formatFileSize(file.Size, locale)}
                                      </td>
                                      <td className="p-2 border whitespace-nowrap">
                                        {file.LastModified
                                          ? dateTimeFormatter.format(
                                              new Date(file.LastModified)
                                            )
                                          : "-"}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                    </div>
                  ))}
                </div>

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
                            onClick={() => deleteConfig(index)}
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
                            <span className="font-medium">{copy.bucket}:</span>
                            <span className="ml-1">{item.config.bucket}</span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Access Key:</span>
                          <span className="ml-1">
                            {item.config.accessKey.substring(0, 4)}***
                            {item.config.accessKey.substring(
                              item.config.accessKey.length - 4
                            )}
                          </span>
                        </div>
                        {item.config.path && (
                          <div>
                            <span className="font-medium">{copy.path}</span>
                            <span className="ml-1">{item.config.path}</span>
                          </div>
                        )}
                        {item.config.region &&
                          item.config.region !== "auto" && (
                            <div>
                              <span className="font-medium">{copy.region}:</span>
                              <span className="ml-1">{item.config.region}</span>
                            </div>
                          )}
                        {item.config.usePathStyle !== undefined && (
                          <div>
                            <span className="font-medium">
                              {copy.usePathStyle}
                            </span>
                            <span className="ml-1">
                              {item.config.usePathStyle ? copy.yes : copy.no}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 删除配置确认对话框 */}
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
                  {isEnglish ? "Delete config " : "确定要删除配置 "}
                  <span className="font-semibold">
                    {isEnglish
                      ? savedConfigs[deleteConfigIndex]?.name
                      : `「${savedConfigs[deleteConfigIndex]?.name}」`}
                  </span>{" "}
                  {isEnglish ? "?" : "吗？"}
                  <br />
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
              {copy.confirmDeleteButton}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
