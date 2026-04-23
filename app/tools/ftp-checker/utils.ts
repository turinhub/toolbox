import type { FtpProtocol, FileInfo, PathSegment } from "./types";

export function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined) return "-";
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
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

export function getHostError(host: string): string {
  if (!host) return "主机地址不能为空";
  return "请输入有效的主机名或 IP 地址";
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

export function formatDate(isoString: string): string {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString("zh-CN");
}

export function validateDirName(name: string): string | null {
  if (!name.trim()) return "目录名称不能为空";
  if (name.includes("/") || name.includes("\\")) return "目录名称不能包含斜杠";
  if (name === "." || name === "..") return '目录名称不能是 "." 或 ".."';
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
