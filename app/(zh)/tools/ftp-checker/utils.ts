import type { FtpProtocol, FileInfo, PathSegment } from "./types";
import { englishLocale } from "@/i18n/config";

const getNumberFormatter = (locale = "zh-CN") =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  });

const getDateTimeFormatter = (locale = "zh-CN") =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  });

export function formatFileSize(
  bytes: number | undefined,
  locale = "zh-CN"
): string {
  if (bytes === undefined) return "-";
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${getNumberFormatter(locale).format(bytes / Math.pow(1024, i))} ${sizes[i]}`;
}

export function getDefaultPort(
  protocol: FtpProtocol,
  ftpsMode?: string
): number {
  if (protocol === "sftp") return 22;
  if (protocol === "ftps" && ftpsMode === "implicit") return 990;
  return 21;
}

export function validateHost(host: string): boolean {
  if (!host) return false;
  const hostnameRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  return hostnameRegex.test(host) || ipv4Regex.test(host);
}

export function getHostError(host: string, locale = "zh-CN"): string {
  const isEnglish = locale === englishLocale;
  if (!host) return isEnglish ? "Host is required" : "主机地址不能为空";
  return isEnglish
    ? "Enter a valid host name or IP address"
    : "请输入有效的主机名或 IP 地址";
}

// ===== 文件浏览辅助函数 =====

export function splitPath(path: string): PathSegment[] {
  if (path === "/" || path === "") return [{ name: "/", path: "/" }];
  const parts = path.split("/").filter(Boolean);
  return [
    { name: "/", path: "/" },
    ...parts.map((part, i) => ({
      name: part,
      path: "/" + parts.slice(0, i + 1).join("/"),
    })),
  ];
}

export function joinPath(...segments: string[]): string {
  const joined = segments.join("/").replace(/\/+/g, "/");
  return joined || "/";
}

export function getParentPath(path: string): string {
  if (path === "/") return "/";
  const parts = path.replace(/\/$/, "").split("/");
  parts.pop();
  const result = parts.join("/");
  return result || "/";
}

export function getBaseName(path: string): string {
  const parts = path.replace(/\/$/, "").split("/");
  return parts[parts.length - 1] || "/";
}

export function formatDate(isoString: string, locale = "zh-CN"): string {
  if (!isoString) return "-";
  return getDateTimeFormatter(locale).format(new Date(isoString));
}

export function validateDirName(name: string, locale = "zh-CN"): string | null {
  const isEnglish = locale === englishLocale;
  if (!name.trim()) {
    return isEnglish ? "Directory name is required" : "目录名称不能为空";
  }
  if (name.includes("/") || name.includes("\\")) {
    return isEnglish
      ? "Directory name cannot contain slashes"
      : "目录名称不能包含斜杠";
  }
  if (name === "." || name === "..") {
    return isEnglish
      ? 'Directory name cannot be "." or ".."'
      : '目录名称不能是 "." 或 ".."';
  }
  return null;
}

export function sortFiles(files: FileInfo[]): FileInfo[] {
  return [...files].sort((a, b) => {
    if (a.type === "directory" && b.type !== "directory") return -1;
    if (a.type !== "directory" && b.type === "directory") return 1;
    return a.name.localeCompare(b.name);
  });
}

export const MAX_DOWNLOAD_SIZE = 50 * 1024 * 1024;
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
