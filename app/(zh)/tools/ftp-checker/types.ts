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
  locale?: string;
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

export interface PathSegment {
  name: string;
  path: string;
}
