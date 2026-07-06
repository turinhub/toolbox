import * as ftp from "basic-ftp";
import SftpClient from "ssh2-sftp-client";
import { Readable } from "stream";
import type { FtpConfig, FileInfo } from "./types";

export const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "未知错误";
};

export const extractErrorDetails = (error: unknown): Record<string, string> => {
  const details: Record<string, string> = {};
  if (typeof error !== "object" || error === null) {
    details["Error"] = String(error);
    return details;
  }
  const err = error as Record<string, unknown>;
  if (err.code) details["Code"] = String(err.code);
  if (err.name) details["Error Name"] = String(err.name);
  if (err.message) details["Message"] = String(err.message);
  if (err.level) details["SSH Level"] = String(err.level);
  if (err.description) details["SSH Description"] = String(err.description);
  return details;
};

export async function connectFtp(config: FtpConfig): Promise<ftp.Client> {
  const client = new ftp.Client(config.timeout || 30000);
  const { host, port, username, password, ftpsMode } = config;
  const isImplicit = config.protocol === "ftps" && ftpsMode === "implicit";
  await client.access({
    host,
    port,
    user: username || "anonymous",
    password: password || "anonymous@",
    secure: isImplicit ? "implicit" : config.protocol === "ftps",
    secureOptions:
      config.protocol === "ftps"
        ? { rejectUnauthorized: config.skipCertVerify !== true }
        : undefined,
  });
  return client;
}

export async function connectSftp(config: FtpConfig): Promise<SftpClient> {
  const sftp = new SftpClient("ftp-tool");
  const { host, port, username, password, privateKey, passphrase, timeout } =
    config;
  const opts: Record<string, unknown> = {
    host,
    port: port || 22,
    username: username || "anonymous",
    readyTimeout: timeout || 30000,
    retries: 0,
  };
  if (privateKey) {
    opts.privateKey = Buffer.from(privateKey);
    if (passphrase) opts.passphrase = passphrase;
  } else {
    opts.password = password || "";
  }
  await sftp.connect(opts as never);
  return sftp;
}

export function convertFtpFileInfo(files: ftp.FileInfo[]): FileInfo[] {
  return files.map(file => ({
    name: file.name,
    size: file.size,
    modifiedAt: file.modifiedAt?.toISOString() ?? "",
    type: file.isDirectory
      ? "directory"
      : file.isSymbolicLink
        ? "symlink"
        : "file",
  }));
}

export function convertSftpFileInfo(files: any[]) {
  return files.map(file => ({
    name: String(file.name ?? ""),
    size: Number(file.size ?? 0),
    modifiedAt: file.modifyTime
      ? new Date(Number(file.modifyTime)).toISOString()
      : "",
    type:
      file.type === "d" ? "directory" : file.type === "l" ? "symlink" : "file",
  })) satisfies FileInfo[];
}

export function toNodeReadable(stream: ReadableStream<Uint8Array>): Readable {
  return Readable.fromWeb(stream as never);
}

export async function closeSftpQuietly(sftp: SftpClient): Promise<void> {
  try {
    await sftp.end();
  } catch {
    /* ignore close error */
  }
}
