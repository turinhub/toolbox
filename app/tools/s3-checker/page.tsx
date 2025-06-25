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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  S3ServiceException,
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface TestResult {
  step: string;
  status: "success" | "error" | "pending";
  message?: string;
  data?: S3Object[];
}

interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  path: string;
  region?: string;
  usePathStyle?: boolean;
}

// 定义错误类型
type S3Error = S3ServiceException | Error | unknown;

export default function S3CheckerPage() {
  const [endpoint, setEndpoint] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [bucket, setBucket] = useState("");
  const [path, setPath] = useState("");
  const [region, setRegion] = useState("auto");
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [usePathStyle, setUsePathStyle] = useState(true);
  const [savedConfigs, setSavedConfigs] = useState<
    { name: string; config: S3Config }[]
  >([]);
  const [configName, setConfigName] = useState("");
  const [endpointError, setEndpointError] = useState("");
  const [activeTab, setActiveTab] = useState("connection");
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copyState, setCopyState] = useState<{ [key: string]: boolean }>({});

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
      setEndpointError("请输入有效的 URL，例如 https://s3.example.com");
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
      config.usePathStyle !== undefined ? config.usePathStyle : true
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
    const newConfigs = [...savedConfigs];
    newConfigs.splice(index, 1);
    setSavedConfigs(newConfigs);
    localStorage.setItem("s3-checker-configs", JSON.stringify(newConfigs));
    toast.success("配置已删除");
  };

  const getErrorMessage = (error: S3Error): string => {
    console.error("详细错误信息:", error);

    // 处理 Failed to fetch 错误
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      return "网络请求失败，可能原因：\n1. 跨域问题 (CORS)\n2. Endpoint URL 格式不正确\n3. 网络连接问题\n\n建议检查 Endpoint 是否包含协议(http/https)和正确的端口";
    }

    if (error instanceof S3ServiceException) {
      switch (error.name) {
        case "NoSuchBucket":
          return `存储桶 "${bucket}" 不存在`;
        case "AccessDenied":
          return "访问被拒绝，请检查您的访问凭证和权限";
        case "InvalidAccessKeyId":
          return "Access Key 无效";
        case "SignatureDoesNotMatch":
          return "Secret Key 无效或签名不匹配";
        case "NetworkingError":
          return "网络错误，请检查您的 Endpoint 是否正确";
        case "ConnectionTimeoutError":
          return "连接超时，请检查 Endpoint 是否可访问";
        default:
          return `${error.name}: ${error.message}`;
      }
    }

    if (error instanceof Error) {
      if (error.message.includes("ENOTFOUND")) {
        return "Endpoint 域名无法解析，请检查是否正确";
      }
      if (error.message.includes("ECONNREFUSED")) {
        return "Endpoint 连接被拒绝，请检查地址和端口是否正确";
      }
      if (error.message.includes("NetworkError")) {
        return "网络错误，可能是由于跨域 (CORS) 限制导致，请确保 S3 服务允许跨域请求";
      }
      return `${error.name || "错误"}: ${error.message}`;
    }

    return "未知错误，请查看控制台获取详细信息";
  };

  const updateTestResults = (
    step: string,
    status: "success" | "error" | "pending",
    message?: string,
    data?: S3Object[]
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

  const validateS3Connection = async () => {
    if (!endpoint || !accessKey || !secretKey || !bucket) {
      toast.error("请填写所有必填参数");
      return;
    }

    if (!validateEndpoint(endpoint)) {
      return;
    }

    setIsTesting(true);
    setTestResults([]);

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
        const errorMsg = getErrorMessage(error);
        updateTestResults("列表权限测试", "error", errorMsg);
        throw error;
      }

      // 测试写入权限（创建测试文件）
      try {
        updateTestResults("写入权限测试", "pending");
        const testKey = `test-${Date.now()}.txt`;
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: testKey,
            Body: "S3接口连通性测试文件",
            ContentType: "text/plain",
          })
        );
        updateTestResults("写入权限测试", "success", "写入权限验证通过");

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
          updateTestResults("删除权限测试", "error", getErrorMessage(error));
          // 不抛出错误，因为这不是关键测试
        }
      } catch (error) {
        updateTestResults("写入权限测试", "error", getErrorMessage(error));
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
          updateTestResults("路径访问测试", "error", getErrorMessage(error));
          // 不抛出错误，因为这是可选测试
        }
      }

      // 检查是否有任何错误
      const hasErrors = testResults.some(result => result.status === "error");
      if (!hasErrors) {
        toast.success("S3 接口连接成功，权限验证通过");
      } else {
        toast.error("S3 接口测试部分失败，请查看详细结果");
      }
    } catch (error) {
      console.error("S3 连接测试失败:", error);
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

  // 复制文本到剪贴板
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
          <TabsTrigger value="configs">保存的配置（LocalStorage）</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>连接参数</CardTitle>
              <CardDescription>
                请输入您的S3兼容存储服务配置信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>区域（可选）</Label>
                  <Input
                    placeholder="auto"
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="path-style"
                    checked={usePathStyle}
                    onCheckedChange={setUsePathStyle}
                  />
                  <Label htmlFor="path-style">使用路径风格访问</Label>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={validateS3Connection}
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
    </div>
  );
}

// 添加文件大小格式化函数
function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined) return "-";
  if (bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}
