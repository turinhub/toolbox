"use server";

import * as ftp from "basic-ftp";
import SftpClient from "ssh2-sftp-client";
import { Readable, Writable } from "stream";
import type { FtpConfig, FileInfo, TestResult } from "./types";
import { joinPath, sortFiles } from "./utils";
import {
  connectFtp,
  connectSftp,
  convertFtpFileInfo,
  convertSftpFileInfo,
  extractErrorDetails,
  getErrorMessage,
} from "./server";

// ===== 连接测试 =====

async function testFtpConnection(config: FtpConfig): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const {
    host,
    port,
    username,
    password,
    remotePath,
    ftpsMode,
    timeout = 30000,
  } = config;

  const addResult = (
    step: string,
    status: TestResult["status"],
    message?: string,
    data?: FileInfo[],
    errorDetails?: Record<string, string>
  ) => {
    results.push({ step, status, message, data, errorDetails });
  };

  const client = new ftp.Client(timeout);
  try {
    try {
      const isImplicit = config.protocol === "ftps" && ftpsMode === "implicit";
      await client.access({
        host,
        port,
        user: username || "anonymous",
        password: password || "anonymous@",
        secure: isImplicit ? "implicit" : config.protocol === "ftps",
        secureOptions:
          config.protocol === "ftps"
            ? { rejectUnauthorized: config.skipCertVerify === true }
            : undefined,
      });
      addResult(
        "连接与认证",
        "success",
        `成功连接到 ${host}:${port} 并完成认证`
      );
    } catch (error) {
      const details = extractErrorDetails(error);
      const msg = getErrorMessage(error);
      if (msg.includes("530") || msg.includes("Login"))
        addResult(
          "连接与认证",
          "error",
          "认证失败：用户名或密码错误",
          undefined,
          details
        );
      else if (msg.includes("ECONNREFUSED") || msg.includes("refused"))
        addResult(
          "连接与认证",
          "error",
          "连接被拒绝，请检查主机地址和端口",
          undefined,
          details
        );
      else if (msg.includes("ENOTFOUND"))
        addResult(
          "连接与认证",
          "error",
          "主机名无法解析，请检查地址是否正确",
          undefined,
          details
        );
      else if (msg.includes("ETIMEDOUT") || msg.includes("timed out"))
        addResult(
          "连接与认证",
          "error",
          "连接超时，请检查网络或防火墙设置",
          undefined,
          details
        );
      else addResult("连接与认证", "error", msg, undefined, details);
      return results;
    }

    const listPath = remotePath || "/";
    try {
      const files = convertFtpFileInfo(await client.list(listPath));
      addResult(
        "目录列表测试",
        "success",
        `成功列出 "${listPath}" 目录，共 ${files.length} 个条目`,
        files
      );
    } catch (error) {
      addResult(
        "目录列表测试",
        "error",
        getErrorMessage(error),
        undefined,
        extractErrorDetails(error)
      );
    }

    const testFilePath = `${listPath.replace(/\/$/, "")}/__ftp-test-${Date.now()}.txt`;
    const testContent = `FTP connectivity test - ${new Date().toISOString()}`;
    try {
      await client.uploadFrom(Readable.from(testContent), testFilePath);
      addResult("上传测试", "success", "文件上传成功");
    } catch (error) {
      addResult(
        "上传测试",
        "error",
        getErrorMessage(error),
        undefined,
        extractErrorDetails(error)
      );
      return results;
    }

    try {
      const sink = new Writable({ write: (_chunk, _encoding, cb) => cb() });
      await client.downloadTo(sink, testFilePath);
      addResult("下载测试", "success", "文件下载成功");
    } catch (error) {
      addResult(
        "下载测试",
        "error",
        getErrorMessage(error),
        undefined,
        extractErrorDetails(error)
      );
    }

    try {
      await client.remove(testFilePath);
      addResult("删除测试", "success", "测试文件已清理");
    } catch (error) {
      addResult(
        "删除测试",
        "error",
        getErrorMessage(error),
        undefined,
        extractErrorDetails(error)
      );
    }
  } catch (error) {
    addResult(
      "连接测试",
      "error",
      getErrorMessage(error),
      undefined,
      extractErrorDetails(error)
    );
  } finally {
    client.close();
  }
  return results;
}

async function testSftpConnection(config: FtpConfig): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const {
    host,
    port,
    username,
    password,
    remotePath,
    privateKey,
    passphrase,
    timeout = 30000,
  } = config;

  const addResult = (
    step: string,
    status: TestResult["status"],
    message?: string,
    data?: FileInfo[],
    errorDetails?: Record<string, string>
  ) => {
    results.push({ step, status, message, data, errorDetails });
  };

  const sftp = new SftpClient("ftp-checker");
  try {
    try {
      const opts: Record<string, unknown> = {
        host,
        port: port || 22,
        username: username || "anonymous",
        readyTimeout: timeout,
        retries: 0,
      };
      if (privateKey) {
        opts.privateKey = Buffer.from(privateKey);
        if (passphrase) opts.passphrase = passphrase;
      } else {
        opts.password = password || "";
      }
      await sftp.connect(opts as any);
      addResult(
        "连接与认证",
        "success",
        `成功连接到 ${host}:${port || 22} 并完成 SSH 认证`
      );
    } catch (error) {
      const details = extractErrorDetails(error);
      const msg = getErrorMessage(error);
      if (msg.includes("ECONNREFUSED") || msg.includes("refused"))
        addResult(
          "连接与认证",
          "error",
          "连接被拒绝，请检查主机地址和端口",
          undefined,
          details
        );
      else if (msg.includes("ENOTFOUND"))
        addResult(
          "连接与认证",
          "error",
          "主机名无法解析，请检查地址是否正确",
          undefined,
          details
        );
      else if (
        msg.includes("ETIMEDOUT") ||
        msg.includes("timed out") ||
        msg.includes("Timed out")
      )
        addResult(
          "连接与认证",
          "error",
          "连接超时，请检查网络或防火墙设置",
          undefined,
          details
        );
      else if (
        msg.includes("password") ||
        msg.includes("auth") ||
        msg.includes("All configured")
      )
        addResult(
          "连接与认证",
          "error",
          "认证失败：密码或密钥错误",
          undefined,
          details
        );
      else if (msg.includes("hostkey") || msg.includes("host key"))
        addResult(
          "连接与认证",
          "error",
          "主机密钥验证失败",
          undefined,
          details
        );
      else addResult("连接与认证", "error", msg, undefined, details);
      return results;
    }

    const listPath = remotePath || "/";
    try {
      const files = convertSftpFileInfo(await sftp.list(listPath));
      addResult(
        "目录列表测试",
        "success",
        `成功列出 "${listPath}" 目录，共 ${files.length} 个条目`,
        files
      );
    } catch (error) {
      addResult(
        "目录列表测试",
        "error",
        getErrorMessage(error),
        undefined,
        extractErrorDetails(error)
      );
    }

    const testFilePath = `${listPath.replace(/\/$/, "")}/__sftp-test-${Date.now()}.txt`;
    const testContent = `SFTP connectivity test - ${new Date().toISOString()}`;
    try {
      await sftp.put(Buffer.from(testContent), testFilePath);
      addResult("上传测试", "success", "文件上传成功");
    } catch (error) {
      addResult(
        "上传测试",
        "error",
        getErrorMessage(error),
        undefined,
        extractErrorDetails(error)
      );
      return results;
    }

    try {
      await sftp.get(testFilePath);
      addResult("下载测试", "success", "文件下载成功");
    } catch (error) {
      addResult(
        "下载测试",
        "error",
        getErrorMessage(error),
        undefined,
        extractErrorDetails(error)
      );
    }

    try {
      await sftp.delete(testFilePath);
      addResult("删除测试", "success", "测试文件已清理");
    } catch (error) {
      addResult(
        "删除测试",
        "error",
        getErrorMessage(error),
        undefined,
        extractErrorDetails(error)
      );
    }
  } catch (error) {
    addResult(
      "连接测试",
      "error",
      getErrorMessage(error),
      undefined,
      extractErrorDetails(error)
    );
  } finally {
    await sftp.end();
  }
  return results;
}

export async function testFtpServerConnection(
  config: FtpConfig
): Promise<TestResult[]> {
  return config.protocol === "sftp"
    ? testSftpConnection(config)
    : testFtpConnection(config);
}

// ===== 文件浏览操作 =====

export async function listDirectory(config: FtpConfig, path: string) {
  try {
    if (config.protocol === "sftp") {
      const sftp = await connectSftp(config);
      try {
        return {
          success: true,
          files: sortFiles(convertSftpFileInfo(await sftp.list(path))),
          currentPath: path,
        };
      } finally {
        await sftp.end();
      }
    }
    const client = await connectFtp(config);
    try {
      return {
        success: true,
        files: sortFiles(convertFtpFileInfo(await client.list(path))),
        currentPath: path,
      };
    } finally {
      client.close();
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteItem(
  config: FtpConfig,
  remotePath: string,
  type: "file" | "directory" | "symlink"
) {
  try {
    if (config.protocol === "sftp") {
      const sftp = await connectSftp(config);
      try {
        if (type === "directory") await sftp.rmdir(remotePath, true);
        else await sftp.delete(remotePath);
        return { success: true };
      } finally {
        await sftp.end();
      }
    }
    const client = await connectFtp(config);
    try {
      if (type === "directory") await client.removeDir(remotePath);
      else await client.remove(remotePath);
      return { success: true };
    } finally {
      client.close();
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function createDirectory(
  config: FtpConfig,
  remotePath: string,
  dirName: string
) {
  const fullPath = joinPath(remotePath, dirName);
  try {
    if (config.protocol === "sftp") {
      const sftp = await connectSftp(config);
      try {
        await sftp.mkdir(fullPath);
        return { success: true };
      } finally {
        await sftp.end();
      }
    }
    const client = await connectFtp(config);
    try {
      await client.ensureDir(fullPath);
      return { success: true };
    } finally {
      client.close();
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
