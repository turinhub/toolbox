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

export default function S3CheckerPage() {
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
  const [activeTab, setActiveTab] = useState("connection");
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>({});
  const [useServerProxy, setUseServerProxy] = useState(true);
  const [showPathStyleDetails, setShowPathStyleDetails] = useState(false);
  const [deleteConfigIndex, setDeleteConfigIndex] = useState<number | null>(
    null
  );
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
        console.error("无法解析保存的配置:", e);
      }
    }
  }, []);

  const validateEndpointInput = (value: string) => {
    if (!validateEndpoint(value)) {
      setEndpointError(getEndpointError(value));
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
        accessKey,
        secretKey,
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
      toast.success("配置已更新");
    } else {
      // 不存在同名配置，添加新配置
      const newConfigs = [...savedConfigs, newConfig];
      setSavedConfigs(newConfigs);
      localStorage.setItem("s3-checker-configs", JSON.stringify(newConfigs));
      toast.success("配置已保存");
    }
    setConfigName("");
  };

  const loadConfig = (config: S3Config, configName?: string) => {
    // 清空之前的测试结果
    setTestResults([]);

    // 加载配置
    setEndpoint(config.endpoint || "");
    setAccessKey(config.accessKey || "");
    setSecretKey(config.secretKey || "");
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

    toast.success("配置已加载");

    // 自动跳转到连接测试标签页
    setActiveTab("connection");
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
    toast.success("配置已删除");
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
      toast.error("请填写所有必填参数");
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
        });
        setTestResults(results);

        const hasError = results.some(r => r.status === "error");
        if (!hasError) {
          toast.success("S3 服务端连接测试通过！");
        } else {
          toast.error("S3 服务端连接测试存在失败项，请检查详情。");
        }
      } catch (error) {
        console.error("服务端测试调用失败:", error);
        toast.error("服务端测试调用失败，请检查网络或日志");
      } finally {
        setIsTesting(false);
      }
      return;
    }

    let hasStepError = false;

    try {
      // 初始化 S3 客户端
      updateTestResults("初始化连接", "pending");
      const s3Client = new S3Client({
        endpoint,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        forcePathStyle: usePathStyle,
        region: region || "auto",
      });
      updateTestResults("初始化连接", "success", "客户端初始化成功");

      // 添加 CORS 预检测提示
      updateTestResults(
        "CORS 检测",
        "success",
        "浏览器安全模式下进行测试，如遇连接失败请切换到服务端代理模式"
      );

      // Bucket连接可用性测试（可选步骤，失败不影响后续测试）
      try {
        updateTestResults("Bucket连接测试", "pending");
        await s3Client.send(
          new HeadBucketCommand({
            Bucket: bucket,
          })
        );
        updateTestResults("Bucket连接测试", "success", "Bucket 连接正常且存在");
      } catch (error) {
        const errorMsg = getErrorMessage(error, bucket, endpoint);
        const details = extractErrorDetails(error, endpoint);

        // 特殊处理 NoSuchKey：在 HeadBucket 中出现通常意味着 Endpoint 包含了路径
        if (
          details["Code"] === "NoSuchKey" ||
          (error as any).name === "NoSuchKey"
        ) {
          details["Possible Root Cause"] =
            "Endpoint 格式可能不正确。请确保 Endpoint 仅包含协议和域名（如 https://oss-cn-hangzhou.aliyuncs.com），不要包含 Bucket 名称或子路径。";
          updateTestResults(
            "Bucket连接测试",
            "error",
            "连接失败：Endpoint 可能包含多余路径",
            undefined,
            details
          );
        } else {
          // HEAD 请求失败可能是因为 CORS 或认证问题，但继续后续测试
          updateTestResults(
            "Bucket连接测试",
            "error",
            errorMsg + "\n\n⚠️ 已跳过此步骤，继续后续测试...",
            undefined,
            details
          );
        }
        // 不抛出错误，继续执行后续测试
      }

      // 测试列表对象权限
      try {
        updateTestResults("列表权限测试", "pending");
        const listResult = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            MaxKeys: 10,
          })
        );

        // 格式化列表数据
        const fileList = listResult.Contents || [];
        let resultMessage = "列表权限验证通过";

        if (fileList.length > 0) {
          resultMessage += `，获取到 ${fileList.length} 个文件`;
        } else {
          resultMessage += "，存储桶为空";
        }

        updateTestResults("列表权限测试", "success", resultMessage, fileList);
      } catch (error) {
        hasStepError = true;
        const errorMsg = getErrorMessage(error, bucket, endpoint);
        updateTestResults(
          "列表权限测试",
          "error",
          errorMsg,
          undefined,
          extractErrorDetails(error, endpoint)
        );
        // 不抛出错误，继续进行写入测试，以支持“只写”场景
      }

      // 测试写入权限（创建测试文件）
      try {
        updateTestResults("写入权限测试", "pending");
        const testKey = `test-${Date.now()}.txt`;
        const testContent = "S3接口连通性测试文件";
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: testKey,
            Body: testContent,
            ContentType: "text/plain",
          })
        );
        updateTestResults("写入权限测试", "success", "写入权限验证通过");

        // 测试读取权限（读取刚才写入的文件）
        try {
          updateTestResults("读取权限测试", "pending");
          const getResult = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucket,
              Key: testKey,
            })
          );

          // 验证读取内容（简单验证 status 即可，流读取较复杂且非必要）
          if (getResult.$metadata.httpStatusCode === 200) {
            updateTestResults("读取权限测试", "success", "读取权限验证通过");
          } else {
            throw new Error(
              `HTTP Status: ${getResult.$metadata.httpStatusCode}`
            );
          }
        } catch (error) {
          // 读取失败不影响后续删除
          updateTestResults(
            "读取权限测试",
            "error",
            getErrorMessage(error, bucket, endpoint),
            undefined,
            extractErrorDetails(error, endpoint)
          );
        }

        // 清理测试文件
        try {
          updateTestResults("删除权限测试", "pending");
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: testKey,
            })
          );
          updateTestResults("删除权限测试", "success", "删除权限验证通过");
        } catch (error) {
          // 删除失败不中断流程，也不标记为关键步骤错误，但记录错误
          updateTestResults(
            "删除权限测试",
            "error",
            getErrorMessage(error, bucket, endpoint),
            undefined,
            extractErrorDetails(error, endpoint)
          );
          // 不抛出错误，因为这不是关键测试
        }
      } catch (error) {
        hasStepError = true;
        updateTestResults(
          "写入权限测试",
          "error",
          getErrorMessage(error, bucket, endpoint),
          undefined,
          extractErrorDetails(error, endpoint)
        );
        // 不抛出错误，继续测试其他功能
      }

      // 测试指定路径访问
      if (path) {
        try {
          updateTestResults("路径访问测试", "pending");
          const pathResult = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: bucket,
              Prefix: path,
              MaxKeys: 10,
            })
          );

          // 格式化路径列表数据
          const pathFiles = pathResult.Contents || [];
          let pathMessage = `路径 "${path}" 访问成功`;

          if (pathFiles.length > 0) {
            pathMessage += `，获取到 ${pathFiles.length} 个文件`;
          } else {
            pathMessage += "，路径为空";
          }

          updateTestResults("路径访问测试", "success", pathMessage, pathFiles);
        } catch (error) {
          // 路径测试失败不标记为 hasStepError，避免阻止后续流程（虽然这里已经是最后了）
          // 或者如果是可选测试，就不应该算作“阻断性错误”
          updateTestResults(
            "路径访问测试",
            "error",
            getErrorMessage(error, bucket, endpoint),
            undefined,
            extractErrorDetails(error, endpoint)
          );
          // 不抛出错误，因为这是可选测试
        }
      }

      // 检查是否有任何错误
      const hasErrors =
        testResults.some(result => result.status === "error") || hasStepError;
      if (!hasErrors) {
        toast.success("S3 接口连接成功，权限验证通过");
      } else {
        toast.error("S3 接口测试部分失败，请查看详细结果");
      }
    } catch (error) {
      console.error("S3 连接测试失败:", error);
      const errorMsg = getErrorMessage(error, bucket, endpoint);
      toast.error(`连接失败: ${errorMsg}`, {
        duration: 6000, // 增加显示时间
      });

      // 只有在没有具体步骤报错的情况下，才添加总体错误结果
      if (!hasStepError) {
        updateTestResults(
          "连接测试",
          "error",
          errorMsg,
          undefined,
          extractErrorDetails(error, endpoint)
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

        toast.success("已复制到剪贴板");
      })
      .catch(err => {
        console.error("复制失败:", err);
        toast.error("复制失败");
      });
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">S3 接口检测</h1>
        <p className="text-muted-foreground">
          S3兼容存储服务连通性及权限检测工具
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="max-w-4xl mx-auto w-full"
      >
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="connection">连接测试</TabsTrigger>
          <TabsTrigger value="configs">配置管理</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>连接参数</CardTitle>
              <CardDescription>
                请输入您的S3兼容存储服务配置信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 连接参数 */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">连接参数</h3>
                </div>

                <div className="space-y-2">
                  <Label>
                    Endpoint <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex">
                    <Input
                      placeholder="https://your-s3-endpoint.com"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Access Key <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex">
                      <Input
                        type={showAccessKey ? "text" : "password"}
                        value={accessKey}
                        onChange={e => setAccessKey(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2"
                        onClick={() => setShowAccessKey(!showAccessKey)}
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
                      >
                        {copyState["accessKey"] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Secret Key <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex">
                      <Input
                        type={showSecretKey ? "text" : "password"}
                        value={secretKey}
                        onChange={e => setSecretKey(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2"
                        onClick={() => setShowSecretKey(!showSecretKey)}
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
                  <div className="space-y-2">
                    <Label>
                      存储桶名称 <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex">
                      <Input
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
                      >
                        {copyState["bucket"] ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>检测路径（可选）</Label>
                    <Input
                      placeholder="path/to/check"
                      value={path}
                      onChange={e => setPath(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 测试模式选择 */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 pb-2">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">测试模式</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-background rounded-md border-2 border-primary/20">
                    <Switch
                      id="use-server-proxy"
                      checked={useServerProxy}
                      onCheckedChange={setUseServerProxy}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="use-server-proxy"
                          className="font-semibold cursor-pointer"
                        >
                          服务端代理模式
                        </Label>
                        <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded-full font-medium">
                          推荐
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        通过服务端转发请求，避免浏览器 CORS
                        跨域限制。更稳定、更安全。
                      </p>
                    </div>
                  </div>

                  {!useServerProxy && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-900">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            <span className="font-semibold">
                              客户端直连模式
                            </span>
                            要求您的 S3 服务已配置 CORS 策略允许此网站访问。
                          </p>
                          <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                            如遇网络请求失败或控制台报 CORS 错误，
                            <span className="font-semibold">
                              请切换回「服务端代理模式」
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 高级选项 */}
              <div className="space-y-4">
                <Collapsible
                  open={showPathStyleDetails}
                  onOpenChange={setShowPathStyleDetails}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 pb-2">
                      <Info className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">高级选项</h3>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1">
                        {showPathStyleDetails ? (
                          <>
                            <span>收起</span>
                            <ChevronUp className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            <span>展开</span>
                            <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>区域（可选）</Label>
                        <Input
                          placeholder="auto"
                          value={region}
                          onChange={e => setRegion(e.target.value)}
                        />
                      </div>
                      <div className="flex items-start space-x-2 pt-6">
                        <Switch
                          id="path-style"
                          checked={usePathStyle}
                          onCheckedChange={setUsePathStyle}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor="path-style"
                            className="cursor-pointer"
                          >
                            使用路径风格访问
                          </Label>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-medium">关闭（默认）：</span>
                            适用于 AWS S3、阿里云 OSS、腾讯云 COS
                            <br />
                            <span className="font-medium">开启：</span>适用于
                            MinIO、Ceph RGW、自建 S3 兼容服务
                          </p>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* 操作按钮 */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex gap-2">
                  <Button
                    onClick={validateS3Connection}
                    className="flex-1"
                    disabled={isTesting}
                  >
                    {isTesting ? "正在检测..." : "开始检测"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={saveConfig}
                    disabled={!configName.trim()}
                    className="min-w-[120px]"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    保存配置
                  </Button>
                </div>
                <Input
                  placeholder="配置名称（保存时填写）"
                  value={configName}
                  onChange={e => setConfigName(e.target.value)}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>测试结果</CardTitle>
                <CardDescription>S3 接口测试的详细结果</CardDescription>
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
                                        <span>隐藏</span>
                                        <ChevronUp className="h-3 w-3" />
                                      </>
                                    ) : (
                                      <>
                                        <span>查看技术详情</span>
                                        <ChevronDown className="h-3 w-3" />
                                      </>
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <div className="text-xs bg-white/50 dark:bg-black/20 p-2 rounded overflow-auto border border-red-200 dark:border-red-900">
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
                              文件列表：
                            </div>
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-muted/50">
                                  <th className="p-2 text-left border">
                                    文件名
                                  </th>
                                  <th className="p-2 text-left border">大小</th>
                                  <th className="p-2 text-left border">
                                    最后修改时间
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
                                        {formatFileSize(file.Size)}
                                      </td>
                                      <td className="p-2 border whitespace-nowrap">
                                        {file.LastModified
                                          ? new Date(
                                              file.LastModified
                                            ).toLocaleString()
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
                  <div className="mt-4 p-4 border border-yellow-500 rounded-md bg-yellow-50 dark:bg-yellow-950/20">
                    <h3 className="font-medium mb-2">常见问题排查：</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>
                        确保 Endpoint URL 格式正确，包含协议（http:// 或
                        https://）
                      </li>
                      <li>检查 Access Key 和 Secret Key 是否正确</li>
                      <li>确认存储桶名称拼写正确且存在</li>
                      <li>如果遇到跨域问题，需要在 S3 服务端配置 CORS 策略</li>
                      <li>
                        检查网络连接是否正常，特别是在使用私有网络或 VPN 时
                      </li>
                      <li>尝试切换&ldquo;使用路径风格访问&rdquo;选项</li>
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
              <CardTitle>已保存的配置</CardTitle>
              <CardDescription>
                加载、查看或管理您保存的 S3 配置
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
                            <span className="font-medium">存储桶:</span>
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
                            <span className="font-medium">路径:</span>
                            <span className="ml-1">{item.config.path}</span>
                          </div>
                        )}
                        {item.config.region &&
                          item.config.region !== "auto" && (
                            <div>
                              <span className="font-medium">区域:</span>
                              <span className="ml-1">{item.config.region}</span>
                            </div>
                          )}
                        {item.config.usePathStyle !== undefined && (
                          <div>
                            <span className="font-medium">路径风格:</span>
                            <span className="ml-1">
                              {item.config.usePathStyle ? "是" : "否"}
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
            <AlertDialogTitle>确认删除配置</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfigIndex !== null && (
                <>
                  确定要删除配置{" "}
                  <span className="font-semibold">
                    「{savedConfigs[deleteConfigIndex]?.name}」
                  </span>{" "}
                  吗？
                  <br />
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
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
