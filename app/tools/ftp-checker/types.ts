export type FtpProtocol = "ftp" | "ftps" | "sftp";

export interface FtpConfig {
  protocol: FtpProtocol;
  host: string;
  port: number;
  username: string;
  password: string;
  remotePath?: string;
  ftpsMode?: "explicit" | "implicit";
  skipCertVerify?: boolean;
  privateKey?: string;
  passphrase?: string;
  timeout?: number;
}

export interface FileInfo {
  name: string;
  size: number;
  modifiedAt: string;
  type: "file" | "directory" | "symlink";
}

export interface TestResult {
  step: string;
  status: "success" | "error" | "pending";
  message?: string;
  data?: FileInfo[];
  errorDetails?: Record<string, string>;
}

export interface SavedConfig {
  name: string;
  config: FtpConfig;
}

export interface CopyState {
  [key: string]: boolean;
}

// ===== 文件浏览相关类型 =====

export interface ListResult {
  success: boolean;
  files?: FileInfo[];
  currentPath?: string;
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  data?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface MkdirResult {
  success: boolean;
  error?: string;
}

export interface PathSegment {
  name: string;
  path: string;
}
