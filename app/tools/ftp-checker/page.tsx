"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  testFtpServerConnection,
  listDirectory,
  deleteItem,
  createDirectory,
} from "./actions";
import {
  AlertCircle,
  CheckCircle2,
  Save,
  Upload,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Server,
  Globe,
  Lock,
  Shield,
  Folder,
  File,
  Link2,
  FolderPlus,
  Download,
  Trash2,
  RefreshCw,
  Search,
  Loader2,
  HardDrive,
} from "lucide-react";
import type {
  FtpProtocol,
  TestResult,
  FtpConfig,
  SavedConfig,
  FileInfo,
  PathSegment,
} from "./types";
import {
  formatFileSize,
  getDefaultPort,
  validateHost,
  getHostError,
  splitPath,
  joinPath,
  getParentPath,
  formatDate,
  validateDirName,
  MAX_UPLOAD_SIZE,
} from "./utils";

interface TransferTokenResponse {
  success?: boolean;
  downloadUrl?: string;
  uploadUrl?: string;
  error?: string;
}

export default function FtpCheckerPage() {
  // ===== 连接配置（三个 Tab 共享） =====
  const [protocol, setProtocol] = useState<FtpProtocol>("ftp");
  const [host, setHost] = useState("");
  const [port, setPort] = useState(21);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remotePath, setRemotePath] = useState("");
  const [ftpsMode, setFtpsMode] = useState<"explicit" | "implicit">("explicit");
  const [skipCertVerify, setSkipCertVerify] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [timeout, setTimeout_] = useState(30);

  const [showPassword, setShowPassword] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [hostError, setHostError] = useState("");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // ===== 连接测试 Tab =====
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [expandedErrorDetails, setExpandedErrorDetails] = useState<Set<number>>(
    new Set()
  );

  // ===== 文件浏览 Tab =====
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [browserPath, setBrowserPath] = useState("/");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMkdirDialog, setShowMkdirDialog] = useState(false);
  const [newDirName, setNewDirName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileInfo | null>(null);

  // ===== 配置管理 =====
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
  const [configName, setConfigName] = useState("");
  const [deleteConfigIndex, setDeleteConfigIndex] = useState<number | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("checker");

  useEffect(() => {
    const configs = localStorage.getItem("ftp-checker-configs");
    if (configs) {
      try {
        setSavedConfigs(JSON.parse(configs));
      } catch {
        /* ignore */
      }
    }
  }, []);

  // ===== 公共辅助 =====

  const buildConfig = (): FtpConfig => ({
    protocol,
    host,
    port,
    username: username || "anonymous",
    password,
    remotePath,
    ftpsMode: protocol === "ftps" ? ftpsMode : undefined,
    skipCertVerify: protocol === "ftps" ? skipCertVerify : undefined,
    privateKey: protocol === "sftp" ? privateKey : undefined,
    passphrase: protocol === "sftp" && passphrase ? passphrase : undefined,
    timeout: timeout * 1000,
  });

  const handleProtocolChange = (value: string) => {
    const p = value as FtpProtocol;
    setProtocol(p);
    setPort(getDefaultPort(p, ftpsMode));
  };

  const handleFtpsModeChange = (value: string) => {
    const m = value as "explicit" | "implicit";
    setFtpsMode(m);
    if (protocol === "ftps") setPort(getDefaultPort("ftps", m));
  };

  const handleHostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setHost(v);
    setHostError(v && !validateHost(v) ? getHostError(v) : "");
  };

  const saveConfig = () => {
    if (!configName.trim()) {
      toast.error("请输入配置名称");
      return;
    }
    const config = buildConfig();
    const idx = savedConfigs.findIndex(item => item.name === configName);
    const entry = { name: configName, config };
    const newConfigs =
      idx >= 0
        ? savedConfigs.map((c, i) => (i === idx ? entry : c))
        : [...savedConfigs, entry];
    setSavedConfigs(newConfigs);
    localStorage.setItem("ftp-checker-configs", JSON.stringify(newConfigs));
    toast.success(idx >= 0 ? "配置已更新" : "配置已保存");
    setConfigName("");
  };

  const loadConfig = (config: FtpConfig, name?: string) => {
    setTestResults([]);
    setIsConnected(false);
    setFiles([]);
    setProtocol(config.protocol || "ftp");
    setHost(config.host || "");
    setPort(config.port || getDefaultPort(config.protocol || "ftp"));
    setUsername(config.username || "");
    setPassword(config.password || "");
    setRemotePath(config.remotePath || "");
    setFtpsMode(config.ftpsMode || "explicit");
    setSkipCertVerify(config.skipCertVerify || false);
    setPrivateKey(config.privateKey || "");
    setPassphrase(config.passphrase || "");
    setTimeout_(config.timeout ? Math.round(config.timeout / 1000) : 30);
    if (name) setConfigName(name);
    toast.success("配置已加载");
    setActiveTab("checker");
  };

  const confirmDeleteConfig = () => {
    if (deleteConfigIndex === null) return;
    const newConfigs = savedConfigs.filter((_, i) => i !== deleteConfigIndex);
    setSavedConfigs(newConfigs);
    localStorage.setItem("ftp-checker-configs", JSON.stringify(newConfigs));
    toast.success("配置已删除");
    setDeleteConfigIndex(null);
  };

  const toggleErrorDetails = (index: number) => {
    setExpandedErrorDetails(prev => {
      const s = new Set(prev);
      if (s.has(index)) s.delete(index);
      else s.add(index);
      return s;
    });
  };

  // ===== 连接测试逻辑 =====

  const testConnection = async () => {
    if (!host) {
      toast.error("请填写主机地址");
      return;
    }
    if (!validateHost(host)) {
      toast.error("主机地址格式不正确");
      return;
    }
    setIsTesting(true);
    setTestResults([]);
    try {
      const results = await testFtpServerConnection(buildConfig());
      setTestResults(results);
      if (!results.some(r => r.status === "error"))
        toast.success("连接测试全部通过！");
      else toast.error("连接测试存在失败项");
    } catch {
      toast.error("测试调用失败");
    } finally {
      setIsTesting(false);
    }
  };

  const getTroubleshootingTips = (): string[] => {
    const tips = [
      "确保主机地址和端口号正确",
      "检查网络连接和防火墙设置",
      "确认用户名和密码正确",
    ];
    if (protocol === "ftps") {
      tips.push("FTPS 需要服务器支持 TLS");
      tips.push("隐式 TLS 端口通常为 990");
    }
    if (protocol === "sftp") {
      tips.push("SFTP 基于 SSH，确保已启用 SSH 服务");
      tips.push("密钥认证需确认私钥格式正确");
    }
    return tips;
  };

  // ===== 文件浏览逻辑 =====

  const navigateTo = useCallback(
    async (path: string) => {
      setIsLoadingFiles(true);
      setSelectedFile(null);
      setSearchQuery("");
      try {
        const result = await listDirectory(buildConfig(), path);
        if (result.success && result.files) {
          setBrowserPath(result.currentPath || path);
          setFiles(result.files);
        } else {
          toast.error(result.error || "加载目录失败");
        }
      } catch {
        toast.error("加载目录失败");
      } finally {
        setIsLoadingFiles(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      protocol,
      host,
      port,
      username,
      password,
      remotePath,
      ftpsMode,
      skipCertVerify,
      privateKey,
      passphrase,
      timeout,
    ]
  );

  const handleConnect = async () => {
    if (!host) {
      toast.error("请填写主机地址");
      return;
    }
    if (!validateHost(host)) {
      toast.error("主机地址格式不正确");
      return;
    }
    setIsConnecting(true);
    try {
      const result = await listDirectory(buildConfig(), remotePath || "/");
      if (result.success && result.files) {
        setBrowserPath(result.currentPath || remotePath || "/");
        setFiles(result.files);
        setIsConnected(true);
        toast.success("连接成功");
      } else {
        toast.error(result.error || "连接失败");
      }
    } catch {
      toast.error("连接失败");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setFiles([]);
    setBrowserPath("/");
    setSelectedFile(null);
  };

  const navigateInto = (dir: FileInfo) => {
    if (dir.type === "directory") navigateTo(joinPath(browserPath, dir.name));
  };

  const navigateUp = () => {
    if (browserPath !== "/") navigateTo(getParentPath(browserPath));
  };

  const handleDownload = async (file: FileInfo) => {
    if (file.type === "directory") return;
    setIsDownloading(true);
    try {
      const response = await fetch("/api/tools/ftp-checker/download-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: buildConfig(),
          remotePath: joinPath(browserPath, file.name),
        }),
      });
      const result = (await response.json()) as TransferTokenResponse;
      if (!response.ok || !result.downloadUrl) {
        toast.error(result.error || "下载失败");
        return;
      }

      const link = document.createElement("a");
      link.href = result.downloadUrl;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`开始下载 ${file.name}`);
    } catch {
      toast.error("下载失败");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error(
        `文件大小超过限制（最大 ${formatFileSize(MAX_UPLOAD_SIZE)}）`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setIsUploading(true);
    try {
      const tokenResponse = await fetch("/api/tools/ftp-checker/upload-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: buildConfig(),
          remotePath: browserPath,
          fileName: file.name,
          fileSize: file.size,
        }),
      });
      const tokenResult = (await tokenResponse.json()) as TransferTokenResponse;
      if (!tokenResponse.ok || !tokenResult.uploadUrl) {
        toast.error(tokenResult.error || "上传失败");
        return;
      }

      const uploadResponse = await fetch(tokenResult.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });
      const uploadResult =
        (await uploadResponse.json()) as TransferTokenResponse;
      if (uploadResponse.ok) {
        toast.success(`已上传 ${file.name}`);
        await navigateTo(browserPath);
      } else {
        toast.error(uploadResult.error || "上传失败");
      }
    } catch {
      toast.error("上传失败");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await deleteItem(
        buildConfig(),
        joinPath(browserPath, deleteTarget.name),
        deleteTarget.type
      );
      if (result.success) {
        toast.success(`已删除 ${deleteTarget.name}`);
        setSelectedFile(null);
        navigateTo(browserPath);
      } else {
        toast.error(result.error || "删除失败");
      }
    } catch {
      toast.error("删除失败");
    }
    setShowDeleteDialog(false);
    setDeleteTarget(null);
  };

  const handleMkdir = async () => {
    const err = validateDirName(newDirName);
    if (err) {
      toast.error(err);
      return;
    }
    try {
      const result = await createDirectory(
        buildConfig(),
        browserPath,
        newDirName
      );
      if (result.success) {
        toast.success(`已创建目录 ${newDirName}`);
        navigateTo(browserPath);
      } else {
        toast.error(result.error || "创建目录失败");
      }
    } catch {
      toast.error("创建目录失败");
    }
    setShowMkdirDialog(false);
    setNewDirName("");
  };

  const filteredFiles = searchQuery
    ? files.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

  const breadcrumbs: PathSegment[] = splitPath(browserPath);

  const getFileIcon = (file: FileInfo) => {
    if (file.type === "directory")
      return <Folder className="h-4 w-4 text-blue-500 shrink-0" />;
    if (file.type === "symlink")
      return <Link2 className="h-4 w-4 text-orange-500 shrink-0" />;
    return <File className="h-4 w-4 text-gray-500 shrink-0" />;
  };

  // ===== 连接配置表单组件 =====

  const ConfigForm = ({ actionButton }: { actionButton: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <CardTitle>连接参数</CardTitle>
        <CardDescription>请输入 FTP/SFTP 服务器的连接信息</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>协议</Label>
          <Select value={protocol} onValueChange={handleProtocolChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ftp">FTP</SelectItem>
              <SelectItem value="ftps">FTPS（FTP over TLS）</SelectItem>
              <SelectItem value="sftp">SFTP（SSH 文件传输）</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">服务器地址</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>
                主机地址 <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="ftp.example.com 或 192.168.1.1"
                value={host}
                onChange={handleHostChange}
                className={hostError ? "border-red-500" : ""}
              />
              {hostError && <p className="text-sm text-red-500">{hostError}</p>}
            </div>
            <div className="space-y-2">
              <Label>端口</Label>
              <Input
                type="number"
                value={port}
                onChange={e => setPort(Number(e.target.value))}
              />
            </div>
          </div>
          {protocol === "ftps" && (
            <div className="space-y-2">
              <Label>FTPS 模式</Label>
              <Select value={ftpsMode} onValueChange={handleFtpsModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="explicit">
                    显式 TLS（Explicit）— 端口 21
                  </SelectItem>
                  <SelectItem value="implicit">
                    隐式 TLS（Implicit）— 端口 990
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="skipCertVerify"
                  checked={skipCertVerify}
                  onCheckedChange={checked =>
                    setSkipCertVerify(checked === true)
                  }
                />
                <Label
                  htmlFor="skipCertVerify"
                  className="text-sm cursor-pointer"
                >
                  跳过证书校验
                </Label>
                <span className="text-xs text-yellow-600 dark:text-yellow-500">
                  （不推荐，仅用于自签名证书）
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">认证信息</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                用户名 <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="anonymous 或您的用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>密码</Label>
              <div className="flex">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={
                    protocol === "sftp"
                      ? "密码或使用密钥认证"
                      : "密码（匿名可留空）"
                  }
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          {protocol === "sftp" && (
            <>
              <div className="space-y-2">
                <Label>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    私钥（可选）
                  </div>
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="text-xs"
                  >
                    {showPrivateKey ? "隐藏私钥" : "展开私钥输入"}
                  </Button>
                  {privateKey && (
                    <span className="text-xs text-muted-foreground self-center">
                      已输入 {privateKey.length} 字符
                    </span>
                  )}
                </div>
                {showPrivateKey && (
                  <Textarea
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                    value={privateKey}
                    onChange={e => setPrivateKey(e.target.value)}
                    className="font-mono text-xs min-h-[120px]"
                  />
                )}
              </div>
              {privateKey && (
                <div className="space-y-2">
                  <Label>密钥密码（可选）</Label>
                  <div className="flex">
                    <Input
                      type={showPassphrase ? "text" : "password"}
                      placeholder="如果私钥有密码请输入"
                      value={passphrase}
                      onChange={e => setPassphrase(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="ml-2"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                    >
                      {showPassphrase ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Collapsible
          open={showAdvancedOptions}
          onOpenChange={setShowAdvancedOptions}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 pb-2">
              <Server className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">高级选项</h3>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                {showAdvancedOptions ? (
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
                <Label>远程路径（可选）</Label>
                <Input
                  placeholder="/ 或 /path/to/dir"
                  value={remotePath}
                  onChange={e => setRemotePath(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>连接超时（秒）</Label>
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={timeout}
                  onChange={e => setTimeout_(Number(e.target.value))}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="space-y-3 pt-2 border-t">
          <div className="flex gap-2">
            {actionButton}
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
  );

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">FTP 工具</h1>
        <p className="text-muted-foreground">
          测试 FTP/FTPS/SFTP 连接，浏览和管理远程文件
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="max-w-5xl mx-auto w-full"
      >
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="checker">连接测试</TabsTrigger>
          <TabsTrigger value="browser">文件浏览</TabsTrigger>
          <TabsTrigger value="configs">配置管理</TabsTrigger>
        </TabsList>

        {/* ===== Tab 1: 连接测试 ===== */}
        <TabsContent value="checker" className="space-y-6">
          {ConfigForm({
            actionButton: (
              <Button
                onClick={testConnection}
                className="flex-1"
                disabled={isTesting}
              >
                {isTesting ? "正在检测..." : "开始检测"}
              </Button>
            ),
          })}

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>测试结果</CardTitle>
                <CardDescription>
                  {protocol.toUpperCase()} 连接测试的详细结果
                </CardDescription>
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
                      {result.status === "success" &&
                        result.data &&
                        result.data.length > 0 && (
                          <div className="mt-2 mb-4 overflow-x-auto">
                            <div className="text-sm font-medium mb-1">
                              文件列表（{result.data.length} 个条目）：
                            </div>
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-muted/50">
                                  <th className="p-2 text-left border">名称</th>
                                  <th className="p-2 text-left border">类型</th>
                                  <th className="p-2 text-left border">大小</th>
                                  <th className="p-2 text-left border">
                                    修改时间
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {(result.data as FileInfo[]).map((file, fi) => (
                                  <tr key={fi} className="border-b">
                                    <td className="p-2 border break-all">
                                      {file.name}
                                    </td>
                                    <td className="p-2 border whitespace-nowrap">
                                      {file.type === "directory"
                                        ? "目录"
                                        : file.type === "symlink"
                                          ? "链接"
                                          : "文件"}
                                    </td>
                                    <td className="p-2 border whitespace-nowrap">
                                      {file.type === "directory"
                                        ? "-"
                                        : formatFileSize(file.size)}
                                    </td>
                                    <td className="p-2 border whitespace-nowrap">
                                      {file.modifiedAt
                                        ? new Date(
                                            file.modifiedAt
                                          ).toLocaleString()
                                        : "-"}
                                    </td>
                                  </tr>
                                ))}
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
                      {getTroubleshootingTips().map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== Tab 2: 文件浏览 ===== */}
        <TabsContent value="browser" className="space-y-6">
          {!isConnected ? (
            ConfigForm({
              actionButton: (
                <Button
                  onClick={handleConnect}
                  className="flex-1"
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      连接中...
                    </>
                  ) : (
                    "连接"
                  )}
                </Button>
              ),
            })
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  已连接到 {host}:{port}
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  断开连接
                </Button>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-1 flex-wrap text-sm min-h-[32px]">
                    <HardDrive className="h-4 w-4 text-muted-foreground shrink-0" />
                    {breadcrumbs.map((seg, i) => (
                      <div key={seg.path} className="flex items-center gap-1">
                        {i > 0 && (
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 px-1.5 text-xs ${i === breadcrumbs.length - 1 ? "font-semibold" : "text-muted-foreground"}`}
                          onClick={() => navigateTo(seg.path)}
                        >
                          {seg.name}
                        </Button>
                      </div>
                    ))}
                    <span className="ml-auto text-xs text-muted-foreground">
                      共 {filteredFiles.length} 项
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateTo(browserPath)}
                      disabled={isLoadingFiles}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-1 ${isLoadingFiles ? "animate-spin" : ""}`}
                      />
                      刷新
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {isUploading ? "上传中..." : "上传文件"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewDirName("");
                        setShowMkdirDialog(true);
                      }}
                    >
                      <FolderPlus className="h-4 w-4 mr-1" />
                      新建文件夹
                    </Button>
                    <div className="flex-1" />
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="搜索文件..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-8 w-48 pl-8 text-sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    {isLoadingFiles ? (
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredFiles.length === 0 ? (
                      <div className="flex items-center justify-center py-20 text-muted-foreground">
                        {searchQuery ? "没有匹配的文件" : "当前目录为空"}
                      </div>
                    ) : (
                      <div className="space-y-0">
                        <div className="grid grid-cols-[1fr_100px_160px_80px_80px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                          <div>名称</div>
                          <div>大小</div>
                          <div>修改时间</div>
                          <div>类型</div>
                          <div className="text-right">操作</div>
                        </div>
                        {browserPath !== "/" && (
                          <div
                            className="grid grid-cols-[1fr_100px_160px_80px_80px] gap-2 px-3 py-2 text-sm border-b hover:bg-muted/50 cursor-pointer items-center"
                            onClick={navigateUp}
                          >
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-blue-500 shrink-0" />
                              <span className="text-muted-foreground">..</span>
                            </div>
                            <div className="text-muted-foreground">-</div>
                            <div className="text-muted-foreground">-</div>
                            <div className="text-muted-foreground">-</div>
                            <div />
                          </div>
                        )}
                        {filteredFiles.map(file => (
                          <div
                            key={file.name}
                            className={`grid grid-cols-[1fr_100px_160px_80px_80px] gap-2 px-3 py-2 text-sm border-b hover:bg-muted/50 cursor-pointer items-center ${selectedFile?.name === file.name ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                            onClick={() => setSelectedFile(file)}
                            onDoubleClick={() =>
                              file.type === "directory" && navigateInto(file)
                            }
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {getFileIcon(file)}
                              <span className="truncate">{file.name}</span>
                            </div>
                            <div className="text-muted-foreground">
                              {file.type === "directory"
                                ? "-"
                                : formatFileSize(file.size)}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {formatDate(file.modifiedAt)}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {file.type === "directory"
                                ? "目录"
                                : file.type === "symlink"
                                  ? "链接"
                                  : "文件"}
                            </div>
                            <div className="flex justify-end gap-1">
                              {file.type !== "directory" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleDownload(file);
                                  }}
                                  disabled={isDownloading}
                                  title="下载"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={e => {
                                  e.stopPropagation();
                                  setDeleteTarget(file);
                                  setShowDeleteDialog(true);
                                }}
                                title="删除"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {selectedFile && (
                    <div className="mt-3 px-3 py-2 bg-muted/30 rounded-md text-xs text-muted-foreground flex items-center gap-4">
                      <span>
                        {selectedFile.type === "directory"
                          ? "目录"
                          : selectedFile.type === "symlink"
                            ? "链接"
                            : "文件"}
                        ：
                        <span className="font-medium text-foreground">
                          {selectedFile.name}
                        </span>
                      </span>
                      {selectedFile.type !== "directory" && (
                        <span>大小：{formatFileSize(selectedFile.size)}</span>
                      )}
                      {selectedFile.modifiedAt && (
                        <span>修改：{formatDate(selectedFile.modifiedAt)}</span>
                      )}
                      <div className="flex-1" />
                      {selectedFile.type === "directory" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => navigateInto(selectedFile)}
                        >
                          打开目录
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          )}
        </TabsContent>

        {/* ===== Tab 3: 配置管理 ===== */}
        <TabsContent value="configs">
          <Card>
            <CardHeader>
              <CardTitle>已保存的配置</CardTitle>
              <CardDescription>
                加载、查看或管理您保存的 FTP/SFTP 配置
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
                            onClick={() => setDeleteConfigIndex(index)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            删除
                          </Button>
                        </div>
                      </div>
                      <div className="p-3 text-sm space-y-2 bg-muted/10">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">协议:</span>
                            <span className="ml-1">
                              {item.config.protocol?.toUpperCase() || "FTP"}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">服务器:</span>
                            <span className="ml-1">
                              {item.config.host}:{item.config.port}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">用户名:</span>
                          <span className="ml-1">{item.config.username}</span>
                        </div>
                        {item.config.remotePath && (
                          <div>
                            <span className="font-medium">远程路径:</span>
                            <span className="ml-1">
                              {item.config.remotePath}
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

      {/* ===== 对话框 ===== */}
      <Dialog open={showMkdirDialog} onOpenChange={setShowMkdirDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>文件夹名称</Label>
              <Input
                placeholder="请输入文件夹名称"
                value={newDirName}
                onChange={e => setNewDirName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleMkdir()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMkdirDialog(false)}>
              取消
            </Button>
            <Button onClick={handleMkdir}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  确定要删除「{deleteTarget.name}」吗？
                  {deleteTarget.type === "directory" && (
                    <span className="block mt-1">
                      将递归删除目录及其所有内容。
                    </span>
                  )}
                  <span className="block mt-1 text-destructive">
                    此操作不可恢复。
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
