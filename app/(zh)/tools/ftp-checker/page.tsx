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
  SelectGroup,
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
import { useLocale } from "next-intl";
import { englishLocale } from "@/i18n/config";

interface TransferTokenResponse {
  success?: boolean;
  downloadUrl?: string;
  uploadUrl?: string;
  error?: string;
}

interface ApiErrorResponse {
  error?: string;
}

type FtpCheckerTab = "checker" | "browser" | "configs";
const FTP_CHECKER_TABS: FtpCheckerTab[] = ["checker", "browser", "configs"];

function getInitialFtpCheckerTab(): FtpCheckerTab {
  if (typeof window === "undefined") return "checker";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return FTP_CHECKER_TABS.includes(tab as FtpCheckerTab)
    ? (tab as FtpCheckerTab)
    : "checker";
}

export default function FtpCheckerPage() {
  const locale = useLocale();
  const isEnglish = locale === englishLocale;
  const copy = isEnglish
    ? {
        enterConfigName: "Enter a config name.",
        updated: "Config updated. Password and private key are not saved.",
        saved: "Config saved. Password and private key are not saved.",
        loaded: "Config loaded. Re-enter password or private key.",
        configDeleted: "Config deleted.",
        hostRequired: "Enter a host address.",
        hostInvalid: "Host address format is invalid.",
        testPassed: "All connection tests passed.",
        testPartial: "Some connection checks failed.",
        testFailed: "Test call failed.",
        loadDirFailed: "Could not load directory.",
        connectSuccess: "Connected.",
        connectFailed: "Connection failed.",
        downloadFailed: "Download failed.",
        downloaded: "Downloaded {name}",
        uploadTooLarge: "File exceeds the limit (max {size}).",
        uploadFailed: "Upload failed.",
        uploaded: "Uploaded {name}",
        deleteFailed: "Delete failed.",
        deleted: "Deleted {name}",
        mkdirFailed: "Could not create directory.",
        mkdirCreated: "Created directory {name}",
        tipsBase: [
          "Ensure the host address and port are correct.",
          "Check network connectivity and firewall settings.",
          "Confirm the username and password are correct.",
        ],
        tipsFtps: [
          "FTPS requires server-side TLS support.",
          "Implicit TLS usually uses port 990.",
        ],
        tipsSftp: [
          "SFTP is based on SSH; make sure SSH is enabled.",
          "For key authentication, confirm that the private key format is correct.",
        ],
        connectionParams: "Connection parameters",
        connectionDesc: "Enter FTP/SFTP server connection details.",
        protocol: "Protocol",
        sftpLabel: "SFTP (SSH File Transfer)",
        serverAddress: "Server address",
        host: "Host address",
        hostPlaceholder: "ftp.example.com or 192.168.1.1",
        port: "Port",
        ftpsMode: "FTPS mode",
        explicitTls: "Explicit TLS - port 21",
        implicitTls: "Implicit TLS - port 990",
        skipCertVerify: "Skip certificate verification",
        notRecommended: "(not recommended, only for self-signed certificates)",
        authInfo: "Authentication",
        username: "Username",
        usernamePlaceholder: "anonymous or your username",
        password: "Password",
        passwordPlaceholderSftp: "Password or key authentication",
        passwordPlaceholder: "Password (leave empty for anonymous)",
        hidePassword: "Hide password",
        showPassword: "Show password",
        privateKey: "Private key (optional)",
        hidePrivateKey: "Hide private key",
        showPrivateKey: "Expand private key input",
        privateKeyEntered: "{count} characters entered",
        passphrase: "Key passphrase (optional)",
        passphrasePlaceholder: "Enter it if the private key has a passphrase",
        hidePassphrase: "Hide key passphrase",
        showPassphrase: "Show key passphrase",
        advanced: "Advanced options",
        collapse: "Collapse",
        expand: "Expand",
        remotePath: "Remote path (optional)",
        timeout: "Connection timeout (seconds)",
        saveConfig: "Save config",
        configNamePlaceholder: "Config name (required to save)",
        saveHint:
          "Saved configs are stored in this browser's localStorage, but password, private key, and passphrase are not saved. Re-enter credentials after loading.",
        checkerTab: "Connection test",
        browserTab: "File browser",
        configsTab: "Config management",
        testing: "Testing...",
        startTest: "Start test",
        results: "Test results",
        resultsDesc: "{protocol} connection test details",
        hide: "Hide",
        showTech: "Show technical details",
        fileListCount: "File list ({count} entries):",
        name: "Name",
        type: "Type",
        size: "Size",
        modifiedAt: "Modified",
        directory: "Directory",
        symlink: "Link",
        file: "File",
        troubleshooting: "Common troubleshooting:",
        connecting: "Connecting...",
        connect: "Connect",
        connectedTo: "Connected to {host}:{port}",
        disconnect: "Disconnect",
        itemsCount: "{count} items",
        refresh: "Refresh",
        uploading: "Uploading...",
        uploadFile: "Upload file",
        newFolder: "New folder",
        searchPlaceholder: "Search files...",
        noMatches: "No matching files",
        emptyDir: "This directory is empty",
        actions: "Actions",
        downloadAria: "Download {name}",
        deleteAria: "Delete {name}",
        sizeLabel: "Size: {size}",
        modifiedLabel: "Modified: {time}",
        openDirectory: "Open directory",
        uploadAria: "Choose a file to upload",
        savedConfigs: "Saved configs",
        savedDescription: "Load, inspect, or manage saved FTP/SFTP configs.",
        noConfigs: "No saved configs",
        load: "Load",
        delete: "Delete",
        server: "Server:",
        remotePathLabel: "Remote path:",
        createFolderTitle: "New folder",
        folderName: "Folder name",
        folderPlaceholder: "Enter a folder name",
        cancel: "Cancel",
        create: "Create",
        confirmDelete: "Delete item?",
        confirmDeleteItem: "Delete \"{name}\"?",
        deleteDirectoryHint: "This will recursively delete the directory and all of its contents.",
        irreversible: "This action cannot be undone.",
        confirmDeleteConfig: "Delete config?",
        confirmDeleteConfigText: "Delete config \"{name}\"?",
      }
    : {
        enterConfigName: "请输入配置名称",
        updated: "配置已更新（密码和私钥不会保存）",
        saved: "配置已保存（密码和私钥不会保存）",
        loaded: "配置已加载，请重新输入密码或私钥",
        configDeleted: "配置已删除",
        hostRequired: "请填写主机地址",
        hostInvalid: "主机地址格式不正确",
        testPassed: "连接测试全部通过！",
        testPartial: "连接测试存在失败项",
        testFailed: "测试调用失败",
        loadDirFailed: "加载目录失败",
        connectSuccess: "连接成功",
        connectFailed: "连接失败",
        downloadFailed: "下载失败",
        downloaded: "已下载 {name}",
        uploadTooLarge: "文件大小超过限制（最大 {size}）",
        uploadFailed: "上传失败",
        uploaded: "已上传 {name}",
        deleteFailed: "删除失败",
        deleted: "已删除 {name}",
        mkdirFailed: "创建目录失败",
        mkdirCreated: "已创建目录 {name}",
        tipsBase: [
          "确保主机地址和端口号正确",
          "检查网络连接和防火墙设置",
          "确认用户名和密码正确",
        ],
        tipsFtps: ["FTPS 需要服务器支持 TLS", "隐式 TLS 端口通常为 990"],
        tipsSftp: [
          "SFTP 基于 SSH，确保已启用 SSH 服务",
          "密钥认证需确认私钥格式正确",
        ],
        connectionParams: "连接参数",
        connectionDesc: "请输入 FTP/SFTP 服务器的连接信息",
        protocol: "协议",
        sftpLabel: "SFTP（SSH 文件传输）",
        serverAddress: "服务器地址",
        host: "主机地址",
        hostPlaceholder: "ftp.example.com 或 192.168.1.1",
        port: "端口",
        ftpsMode: "FTPS 模式",
        explicitTls: "显式 TLS（Explicit）— 端口 21",
        implicitTls: "隐式 TLS（Implicit）— 端口 990",
        skipCertVerify: "跳过证书校验",
        notRecommended: "（不推荐，仅用于自签名证书）",
        authInfo: "认证信息",
        username: "用户名",
        usernamePlaceholder: "anonymous 或您的用户名",
        password: "密码",
        passwordPlaceholderSftp: "密码或使用密钥认证",
        passwordPlaceholder: "密码（匿名可留空）",
        hidePassword: "隐藏密码",
        showPassword: "显示密码",
        privateKey: "私钥（可选）",
        hidePrivateKey: "隐藏私钥",
        showPrivateKey: "展开私钥输入",
        privateKeyEntered: "已输入 {count} 字符",
        passphrase: "密钥密码（可选）",
        passphrasePlaceholder: "如果私钥有密码请输入",
        hidePassphrase: "隐藏密钥密码",
        showPassphrase: "显示密钥密码",
        advanced: "高级选项",
        collapse: "收起",
        expand: "展开",
        remotePath: "远程路径（可选）",
        timeout: "连接超时（秒）",
        saveConfig: "保存配置",
        configNamePlaceholder: "配置名称（保存时填写）",
        saveHint:
          "保存配置会写入当前浏览器 localStorage，但不会保存密码、私钥或 passphrase。加载后请重新输入凭据。",
        checkerTab: "连接测试",
        browserTab: "文件浏览",
        configsTab: "配置管理",
        testing: "正在检测…",
        startTest: "开始检测",
        results: "测试结果",
        resultsDesc: "{protocol} 连接测试的详细结果",
        hide: "隐藏",
        showTech: "查看技术详情",
        fileListCount: "文件列表（{count} 个条目）：",
        name: "名称",
        type: "类型",
        size: "大小",
        modifiedAt: "修改时间",
        directory: "目录",
        symlink: "链接",
        file: "文件",
        troubleshooting: "常见问题排查：",
        connecting: "连接中…",
        connect: "连接",
        connectedTo: "已连接到 {host}:{port}",
        disconnect: "断开连接",
        itemsCount: "共 {count} 项",
        refresh: "刷新",
        uploading: "上传中…",
        uploadFile: "上传文件",
        newFolder: "新建文件夹",
        searchPlaceholder: "搜索文件…",
        noMatches: "没有匹配的文件",
        emptyDir: "当前目录为空",
        actions: "操作",
        downloadAria: "下载 {name}",
        deleteAria: "删除 {name}",
        sizeLabel: "大小：{size}",
        modifiedLabel: "修改：{time}",
        openDirectory: "打开目录",
        uploadAria: "选择要上传的文件",
        savedConfigs: "已保存的配置",
        savedDescription: "加载、查看或管理您保存的 FTP/SFTP 配置",
        noConfigs: "暂无保存的配置",
        load: "加载",
        delete: "删除",
        server: "服务器:",
        remotePathLabel: "远程路径:",
        createFolderTitle: "新建文件夹",
        folderName: "文件夹名称",
        folderPlaceholder: "请输入文件夹名称",
        cancel: "取消",
        create: "创建",
        confirmDelete: "确认删除",
        confirmDeleteItem: "确定要删除「{name}」吗？",
        deleteDirectoryHint: "将递归删除目录及其所有内容。",
        irreversible: "此操作不可恢复。",
        confirmDeleteConfig: "确认删除配置",
        confirmDeleteConfigText: "确定要删除配置「{name}」吗？",
      };
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
  const [activeTab, setActiveTab] = useState<FtpCheckerTab>("checker");

  const handleTabChange = (value: string) => {
    const nextTab = FTP_CHECKER_TABS.includes(value as FtpCheckerTab)
      ? (value as FtpCheckerTab)
      : "checker";
    setActiveTab(nextTab);
    const url = new URL(window.location.href);
    if (nextTab === "checker") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", nextTab);
    }
    window.history.replaceState(null, "", url);
  };

  useEffect(() => {
    setActiveTab(getInitialFtpCheckerTab());
  }, []);

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
    locale,
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
    setHostError(v && !validateHost(v) ? getHostError(v, locale) : "");
  };

  const saveConfig = () => {
    if (!configName.trim()) {
      toast.error(copy.enterConfigName);
      return;
    }
    const config = buildConfig();
    const safeConfig: FtpConfig = {
      ...config,
      password: "",
      privateKey: undefined,
      passphrase: undefined,
    };
    const idx = savedConfigs.findIndex(item => item.name === configName);
    const entry = { name: configName, config: safeConfig };
    const newConfigs =
      idx >= 0
        ? savedConfigs.map((c, i) => (i === idx ? entry : c))
        : [...savedConfigs, entry];
    setSavedConfigs(newConfigs);
    localStorage.setItem("ftp-checker-configs", JSON.stringify(newConfigs));
    toast.success(
      idx >= 0 ? copy.updated : copy.saved
    );
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
    setPassword("");
    setRemotePath(config.remotePath || "");
    setFtpsMode(config.ftpsMode || "explicit");
    setSkipCertVerify(config.skipCertVerify || false);
    setPrivateKey("");
    setPassphrase("");
    setTimeout_(config.timeout ? Math.round(config.timeout / 1000) : 30);
    if (name) setConfigName(name);
    toast.success(copy.loaded);
    handleTabChange("checker");
  };

  const confirmDeleteConfig = () => {
    if (deleteConfigIndex === null) return;
    const newConfigs = savedConfigs.filter((_, i) => i !== deleteConfigIndex);
    setSavedConfigs(newConfigs);
    localStorage.setItem("ftp-checker-configs", JSON.stringify(newConfigs));
    toast.success(copy.configDeleted);
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
      toast.error(copy.hostRequired);
      return;
    }
    if (!validateHost(host)) {
      toast.error(copy.hostInvalid);
      return;
    }
    setIsTesting(true);
    setTestResults([]);
    try {
      const results = await testFtpServerConnection(buildConfig());
      setTestResults(results);
      if (!results.some(r => r.status === "error"))
        toast.success(copy.testPassed);
      else toast.error(copy.testPartial);
    } catch {
      toast.error(copy.testFailed);
    } finally {
      setIsTesting(false);
    }
  };

  const getTroubleshootingTips = (): string[] => {
    const tips = [...copy.tipsBase];
    if (protocol === "ftps") {
      tips.push(...copy.tipsFtps);
    }
    if (protocol === "sftp") {
      tips.push(...copy.tipsSftp);
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
          toast.error(result.error || copy.loadDirFailed);
        }
      } catch {
        toast.error(copy.loadDirFailed);
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
      locale,
      copy.loadDirFailed,
    ]
  );

  const handleConnect = async () => {
    if (!host) {
      toast.error(copy.hostRequired);
      return;
    }
    if (!validateHost(host)) {
      toast.error(copy.hostInvalid);
      return;
    }
    setIsConnecting(true);
    try {
      const result = await listDirectory(buildConfig(), remotePath || "/");
      if (result.success && result.files) {
        setBrowserPath(result.currentPath || remotePath || "/");
        setFiles(result.files);
        setIsConnected(true);
        toast.success(copy.connectSuccess);
      } else {
        toast.error(result.error || copy.connectFailed);
      }
    } catch {
      toast.error(copy.connectFailed);
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
        toast.error(result.error || copy.downloadFailed);
        return;
      }

      const downloadResponse = await fetch(result.downloadUrl);
      if (!downloadResponse.ok) {
        let message = copy.downloadFailed;
        try {
          const errorResult =
            (await downloadResponse.json()) as ApiErrorResponse;
          message = errorResult.error || message;
        } catch {
          message = downloadResponse.statusText || message;
        }
        toast.error(message);
        return;
      }

      const blob = await downloadResponse.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.name;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      toast.success(copy.downloaded.replace("{name}", file.name));
    } catch {
      toast.error(copy.downloadFailed);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error(
        copy.uploadTooLarge.replace(
          "{size}",
          formatFileSize(MAX_UPLOAD_SIZE, locale)
        )
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
        toast.error(tokenResult.error || copy.uploadFailed);
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
        toast.success(copy.uploaded.replace("{name}", file.name));
        await navigateTo(browserPath);
      } else {
        toast.error(uploadResult.error || copy.uploadFailed);
      }
    } catch {
      toast.error(copy.uploadFailed);
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
        toast.success(copy.deleted.replace("{name}", deleteTarget.name));
        setSelectedFile(null);
        navigateTo(browserPath);
      } else {
        toast.error(result.error || copy.deleteFailed);
      }
    } catch {
      toast.error(copy.deleteFailed);
    }
    setShowDeleteDialog(false);
    setDeleteTarget(null);
  };

  const handleMkdir = async () => {
    const err = validateDirName(newDirName, locale);
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
        toast.success(copy.mkdirCreated.replace("{name}", newDirName));
        navigateTo(browserPath);
      } else {
        toast.error(result.error || copy.mkdirFailed);
      }
    } catch {
      toast.error(copy.mkdirFailed);
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
        <CardTitle>{copy.connectionParams}</CardTitle>
        <CardDescription>{copy.connectionDesc}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label>{copy.protocol}</Label>
          <Select value={protocol} onValueChange={handleProtocolChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ftp">FTP</SelectItem>
                <SelectItem value="ftps">FTPS (FTP over TLS)</SelectItem>
                <SelectItem value="sftp">{copy.sftpLabel}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">{copy.serverAddress}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col md:col-span-2 gap-2">
              <Label htmlFor="ftp-host">
                {copy.host} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ftp-host"
                name="host"
                autoComplete="url"
                spellCheck={false}
                placeholder={copy.hostPlaceholder}
                value={host}
                onChange={handleHostChange}
                className={hostError ? "border-destructive" : ""}
              />
              {hostError && (
                <p className="text-sm text-destructive">{hostError}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ftp-port">{copy.port}</Label>
              <Input
                id="ftp-port"
                name="port"
                type="number"
                inputMode="numeric"
                autoComplete="off"
                value={port}
                onChange={e => setPort(Number(e.target.value))}
              />
            </div>
          </div>
          {protocol === "ftps" && (
            <div className="flex flex-col gap-2">
              <Label>{copy.ftpsMode}</Label>
              <Select value={ftpsMode} onValueChange={handleFtpsModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="explicit">
                      {copy.explicitTls}
                    </SelectItem>
                    <SelectItem value="implicit">
                      {copy.implicitTls}
                    </SelectItem>
                  </SelectGroup>
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
                  {copy.skipCertVerify}
                </Label>
                <span className="text-xs text-warning">
                  {copy.notRecommended}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">{copy.authInfo}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ftp-username">
                {copy.username} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ftp-username"
                name="username"
                autoComplete="username"
                spellCheck={false}
                placeholder={copy.usernamePlaceholder}
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ftp-password">{copy.password}</Label>
              <div className="flex">
                <Input
                  id="ftp-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  spellCheck={false}
                  placeholder={
                    protocol === "sftp"
                      ? copy.passwordPlaceholderSftp
                      : copy.passwordPlaceholder
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
                  aria-label={
                    showPassword ? copy.hidePassword : copy.showPassword
                  }
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
              <div className="flex flex-col gap-2">
                <Label htmlFor="ftp-private-key">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    {copy.privateKey}
                  </div>
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="text-xs"
                  >
                    {showPrivateKey
                      ? copy.hidePrivateKey
                      : copy.showPrivateKey}
                  </Button>
                  {privateKey && (
                    <span className="text-xs text-muted-foreground self-center">
                      {copy.privateKeyEntered.replace(
                        "{count}",
                        String(privateKey.length)
                      )}
                    </span>
                  )}
                </div>
                {showPrivateKey && (
                  <Textarea
                    id="ftp-private-key"
                    name="privateKey"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;…&#10;-----END OPENSSH PRIVATE KEY-----"
                    value={privateKey}
                    onChange={e => setPrivateKey(e.target.value)}
                    className="font-mono text-xs min-h-[120px]"
                  />
                )}
              </div>
              {privateKey && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ftp-passphrase">{copy.passphrase}</Label>
                  <div className="flex">
                    <Input
                      id="ftp-passphrase"
                      name="passphrase"
                      type={showPassphrase ? "text" : "password"}
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={copy.passphrasePlaceholder}
                      value={passphrase}
                      onChange={e => setPassphrase(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="ml-2"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      aria-label={
                        showPassphrase
                          ? copy.hidePassphrase
                          : copy.showPassphrase
                      }
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
              <h3 className="font-semibold">{copy.advanced}</h3>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                {showAdvancedOptions ? (
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
                <Label htmlFor="ftp-remote-path">{copy.remotePath}</Label>
                <Input
                  id="ftp-remote-path"
                  name="remotePath"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="/ or /path/to/dir"
                  value={remotePath}
                  onChange={e => setRemotePath(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ftp-timeout">{copy.timeout}</Label>
                <Input
                  id="ftp-timeout"
                  name="timeout"
                  type="number"
                  inputMode="numeric"
                  autoComplete="off"
                  min={5}
                  max={120}
                  value={timeout}
                  onChange={e => setTimeout_(Number(e.target.value))}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex flex-col pt-2 border-t gap-3">
          <div className="flex gap-2">
            {actionButton}
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
  );

  return (
    <div className="flex flex-col gap-8 pb-8">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="max-w-5xl mx-auto w-full"
      >
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="checker">{copy.checkerTab}</TabsTrigger>
          <TabsTrigger value="browser">{copy.browserTab}</TabsTrigger>
          <TabsTrigger value="configs">{copy.configsTab}</TabsTrigger>
        </TabsList>

        {/* ===== Tab 1: 连接测试 ===== */}
        <TabsContent value="checker" className="flex flex-col gap-6">
          {ConfigForm({
            actionButton: (
              <Button
                onClick={testConnection}
                className="flex-1"
                disabled={isTesting}
              >
                {isTesting ? copy.testing : copy.startTest}
              </Button>
            ),
          })}

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{copy.results}</CardTitle>
                <CardDescription>
                  {copy.resultsDesc.replace(
                    "{protocol}",
                    protocol.toUpperCase()
                  )}
                </CardDescription>
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
                      {result.status === "success" &&
                        result.data &&
                        result.data.length > 0 && (
                          <div className="mt-2 mb-4 overflow-x-auto">
                            <div className="text-sm font-medium mb-1">
                              {copy.fileListCount.replace(
                                "{count}",
                                String(result.data.length)
                              )}
                            </div>
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-muted/50">
                                  <th className="p-2 text-left border">
                                    {copy.name}
                                  </th>
                                  <th className="p-2 text-left border">
                                    {copy.type}
                                  </th>
                                  <th className="p-2 text-left border">
                                    {copy.size}
                                  </th>
                                  <th className="p-2 text-left border">
                                    {copy.modifiedAt}
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
                                        ? copy.directory
                                        : file.type === "symlink"
                                          ? copy.symlink
                                          : copy.file}
                                    </td>
                                    <td className="p-2 border whitespace-nowrap">
                                      {file.type === "directory"
                                        ? "-"
                                        : formatFileSize(file.size, locale)}
                                    </td>
                                    <td className="p-2 border whitespace-nowrap">
                                      {file.modifiedAt
                                        ? formatDate(file.modifiedAt, locale)
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
                  <div className="mt-4 p-4 border border-warning rounded-md bg-warning-muted">
                    <h3 className="font-medium mb-2">
                      {copy.troubleshooting}
                    </h3>
                    <ul className="flex flex-col list-disc pl-5 text-sm gap-1">
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
        <TabsContent value="browser" className="flex flex-col gap-6">
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
                      <Loader2
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                      {copy.connecting}
                    </>
                  ) : (
                    copy.connect
                  )}
                </Button>
              ),
            })
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-success dark:text-green-400">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  {copy.connectedTo
                    .replace("{host}", host)
                    .replace("{port}", String(port))}
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  {copy.disconnect}
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
                      {copy.itemsCount.replace(
                        "{count}",
                        String(filteredFiles.length)
                      )}
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
                        data-icon="inline-start"
                        className={isLoadingFiles ? "animate-spin" : ""}
                      />
                      {copy.refresh}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload data-icon="inline-start" />
                      {isUploading ? copy.uploading : copy.uploadFile}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewDirName("");
                        setShowMkdirDialog(true);
                      }}
                    >
                      <FolderPlus data-icon="inline-start" />
                      {copy.newFolder}
                    </Button>
                    <div className="flex-1" />
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="ftp-file-search"
                        name="fileSearch"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder={copy.searchPlaceholder}
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
                        {searchQuery ? copy.noMatches : copy.emptyDir}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0">
                        <div className="grid grid-cols-[1fr_100px_160px_80px_80px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                          <div>{copy.name}</div>
                          <div>{copy.size}</div>
                          <div>{copy.modifiedAt}</div>
                          <div>{copy.type}</div>
                          <div className="text-right">{copy.actions}</div>
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
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedFile(file)}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                if (file.type === "directory") {
                                  navigateInto(file);
                                } else {
                                  setSelectedFile(file);
                                }
                              }
                              if (e.key === " ") {
                                e.preventDefault();
                                setSelectedFile(file);
                              }
                            }}
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
                                : formatFileSize(file.size, locale)}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {formatDate(file.modifiedAt, locale)}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {file.type === "directory"
                                ? copy.directory
                                : file.type === "symlink"
                                  ? copy.symlink
                                  : copy.file}
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
                                  aria-label={copy.downloadAria.replace(
                                    "{name}",
                                    file.name
                                  )}
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
                                aria-label={copy.deleteAria.replace(
                                  "{name}",
                                  file.name
                                )}
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
                          ? copy.directory
                          : selectedFile.type === "symlink"
                            ? copy.symlink
                            : copy.file}
                        ：
                        <span className="font-medium text-foreground">
                          {selectedFile.name}
                        </span>
                      </span>
                      {selectedFile.type !== "directory" && (
                        <span>
                          {copy.sizeLabel.replace(
                            "{size}",
                            formatFileSize(selectedFile.size, locale)
                          )}
                        </span>
                      )}
                      {selectedFile.modifiedAt && (
                        <span>
                          {copy.modifiedLabel.replace(
                            "{time}",
                            formatDate(selectedFile.modifiedAt, locale)
                          )}
                        </span>
                      )}
                      <div className="flex-1" />
                      {selectedFile.type === "directory" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => navigateInto(selectedFile)}
                        >
                          {copy.openDirectory}
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
                aria-label={copy.uploadAria}
              />
            </>
          )}
        </TabsContent>

        {/* ===== Tab 3: 配置管理 ===== */}
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
                            <span className="font-medium">
                              {copy.protocol}:
                            </span>
                            <span className="ml-1">
                              {item.config.protocol?.toUpperCase() || "FTP"}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">{copy.server}</span>
                            <span className="ml-1">
                              {item.config.host}:{item.config.port}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">{copy.username}:</span>
                          <span className="ml-1">{item.config.username}</span>
                        </div>
                        {item.config.remotePath && (
                          <div>
                            <span className="font-medium">
                              {copy.remotePathLabel}
                            </span>
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
            <DialogTitle>{copy.createFolderTitle}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col py-4 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ftp-new-dir-name">{copy.folderName}</Label>
              <Input
                id="ftp-new-dir-name"
                name="newDirName"
                autoComplete="off"
                spellCheck={false}
                placeholder={copy.folderPlaceholder}
                value={newDirName}
                onChange={e => setNewDirName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleMkdir()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMkdirDialog(false)}>
              {copy.cancel}
            </Button>
            <Button onClick={handleMkdir}>{copy.create}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  {copy.confirmDeleteItem.replace(
                    "{name}",
                    deleteTarget.name
                  )}
                  {deleteTarget.type === "directory" && (
                    <span className="block mt-1">
                      {copy.deleteDirectoryHint}
                    </span>
                  )}
                  <span className="block mt-1 text-destructive">
                    {copy.irreversible}
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              {copy.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {copy.delete}
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
            <AlertDialogTitle>{copy.confirmDeleteConfig}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfigIndex !== null && (
                <>
                  {copy.confirmDeleteConfigText.replace(
                    "{name}",
                    savedConfigs[deleteConfigIndex]?.name || ""
                  )}
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
              {copy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
