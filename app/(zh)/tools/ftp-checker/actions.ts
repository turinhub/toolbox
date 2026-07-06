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
import { englishLocale } from "@/i18n/config";

// ===== 连接测试 =====

function getActionCopy(locale = "zh-CN") {
  const isEnglish = locale === englishLocale;
  return isEnglish
    ? {
        authStep: "Connection and authentication",
        authSuccess: "Connected to {host}:{port} and authenticated",
        sshAuthSuccess: "Connected to {host}:{port} and completed SSH authentication",
        loginFailed: "Authentication failed: username or password is incorrect",
        sftpAuthFailed: "Authentication failed: password or key is incorrect",
        refused: "Connection refused. Check the host and port.",
        notFound: "Host name cannot be resolved. Check the address.",
        timeout: "Connection timed out. Check network or firewall settings.",
        hostKeyFailed: "Host key verification failed",
        listStep: "Directory listing test",
        listSuccess: 'Listed "{path}" successfully, {count} entries',
        uploadStep: "Upload test",
        uploadSuccess: "File uploaded successfully",
        downloadStep: "Download test",
        downloadSuccess: "File downloaded successfully",
        deleteStep: "Delete test",
        deleteSuccess: "Test file cleaned up",
        connectionStep: "Connection test",
      }
    : {
        authStep: "连接与认证",
        authSuccess: "成功连接到 {host}:{port} 并完成认证",
        sshAuthSuccess: "成功连接到 {host}:{port} 并完成 SSH 认证",
        loginFailed: "认证失败：用户名或密码错误",
        sftpAuthFailed: "认证失败：密码或密钥错误",
        refused: "连接被拒绝，请检查主机地址和端口",
        notFound: "主机名无法解析，请检查地址是否正确",
        timeout: "连接超时，请检查网络或防火墙设置",
        hostKeyFailed: "主机密钥验证失败",
        listStep: "目录列表测试",
        listSuccess: "成功列出 \"{path}\" 目录，共 {count} 个条目",
        uploadStep: "上传测试",
        uploadSuccess: "文件上传成功",
        downloadStep: "下载测试",
        downloadSuccess: "文件下载成功",
        deleteStep: "删除测试",
        deleteSuccess: "测试文件已清理",
        connectionStep: "连接测试",
      };
}

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
    locale = "zh-CN",
  } = config;
  const copy = getActionCopy(locale);

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
        copy.authStep,
        "success",
        copy.authSuccess.replace("{host}", host).replace("{port}", String(port))
      );
    } catch (error) {
      const details = extractErrorDetails(error);
      const msg = getErrorMessage(error, locale);
      if (msg.includes("530") || msg.includes("Login"))
        addResult(
          copy.authStep,
          "error",
          copy.loginFailed,
          undefined,
          details
        );
      else if (msg.includes("ECONNREFUSED") || msg.includes("refused"))
        addResult(
          copy.authStep,
          "error",
          copy.refused,
          undefined,
          details
        );
      else if (msg.includes("ENOTFOUND"))
        addResult(
          copy.authStep,
          "error",
          copy.notFound,
          undefined,
          details
        );
      else if (msg.includes("ETIMEDOUT") || msg.includes("timed out"))
        addResult(
          copy.authStep,
          "error",
          copy.timeout,
          undefined,
          details
        );
      else addResult(copy.authStep, "error", msg, undefined, details);
      return results;
    }

    const listPath = remotePath || "/";
    try {
      const files = convertFtpFileInfo(await client.list(listPath));
      addResult(
        copy.listStep,
        "success",
        copy.listSuccess
          .replace("{path}", listPath)
          .replace("{count}", String(files.length)),
        files
      );
    } catch (error) {
      addResult(
        copy.listStep,
        "error",
        getErrorMessage(error, locale),
        undefined,
        extractErrorDetails(error)
      );
    }

    const testFilePath = `${listPath.replace(/\/$/, "")}/__ftp-test-${Date.now()}.txt`;
    const testContent = `FTP connectivity test - ${new Date().toISOString()}`;
    try {
      await client.uploadFrom(Readable.from(testContent), testFilePath);
      addResult(copy.uploadStep, "success", copy.uploadSuccess);
    } catch (error) {
      addResult(
        copy.uploadStep,
        "error",
        getErrorMessage(error, locale),
        undefined,
        extractErrorDetails(error)
      );
      return results;
    }

    try {
      const sink = new Writable({ write: (_chunk, _encoding, cb) => cb() });
      await client.downloadTo(sink, testFilePath);
      addResult(copy.downloadStep, "success", copy.downloadSuccess);
    } catch (error) {
      addResult(
        copy.downloadStep,
        "error",
        getErrorMessage(error, locale),
        undefined,
        extractErrorDetails(error)
      );
    }

    try {
      await client.remove(testFilePath);
      addResult(copy.deleteStep, "success", copy.deleteSuccess);
    } catch (error) {
      addResult(
        copy.deleteStep,
        "error",
        getErrorMessage(error, locale),
        undefined,
        extractErrorDetails(error)
      );
    }
  } catch (error) {
    addResult(
      copy.connectionStep,
      "error",
      getErrorMessage(error, locale),
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
    locale = "zh-CN",
  } = config;
  const copy = getActionCopy(locale);

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
        copy.authStep,
        "success",
        copy.sshAuthSuccess
          .replace("{host}", host)
          .replace("{port}", String(port || 22))
      );
    } catch (error) {
      const details = extractErrorDetails(error);
      const msg = getErrorMessage(error, locale);
      if (msg.includes("ECONNREFUSED") || msg.includes("refused"))
        addResult(
          copy.authStep,
          "error",
          copy.refused,
          undefined,
          details
        );
      else if (msg.includes("ENOTFOUND"))
        addResult(
          copy.authStep,
          "error",
          copy.notFound,
          undefined,
          details
        );
      else if (
        msg.includes("ETIMEDOUT") ||
        msg.includes("timed out") ||
        msg.includes("Timed out")
      )
        addResult(
          copy.authStep,
          "error",
          copy.timeout,
          undefined,
          details
        );
      else if (
        msg.includes("password") ||
        msg.includes("auth") ||
        msg.includes("All configured")
      )
        addResult(
          copy.authStep,
          "error",
          copy.sftpAuthFailed,
          undefined,
          details
        );
      else if (msg.includes("hostkey") || msg.includes("host key"))
        addResult(
          copy.authStep,
          "error",
          copy.hostKeyFailed,
          undefined,
          details
        );
      else addResult(copy.authStep, "error", msg, undefined, details);
      return results;
    }

    const listPath = remotePath || "/";
    try {
      const files = convertSftpFileInfo(await sftp.list(listPath));
      addResult(
        copy.listStep,
        "success",
        copy.listSuccess
          .replace("{path}", listPath)
          .replace("{count}", String(files.length)),
        files
      );
    } catch (error) {
      addResult(
        copy.listStep,
        "error",
        getErrorMessage(error, locale),
        undefined,
        extractErrorDetails(error)
      );
    }

    const testFilePath = `${listPath.replace(/\/$/, "")}/__sftp-test-${Date.now()}.txt`;
    const testContent = `SFTP connectivity test - ${new Date().toISOString()}`;
    try {
      await sftp.put(Buffer.from(testContent), testFilePath);
      addResult(copy.uploadStep, "success", copy.uploadSuccess);
    } catch (error) {
      addResult(
        copy.uploadStep,
        "error",
        getErrorMessage(error, locale),
        undefined,
        extractErrorDetails(error)
      );
      return results;
    }

    try {
      await sftp.get(testFilePath);
      addResult(copy.downloadStep, "success", copy.downloadSuccess);
    } catch (error) {
      addResult(
        copy.downloadStep,
        "error",
        getErrorMessage(error, locale),
        undefined,
        extractErrorDetails(error)
      );
    }

    try {
      await sftp.delete(testFilePath);
      addResult(copy.deleteStep, "success", copy.deleteSuccess);
    } catch (error) {
      addResult(
        copy.deleteStep,
        "error",
        getErrorMessage(error, locale),
        undefined,
        extractErrorDetails(error)
      );
    }
  } catch (error) {
    addResult(
      copy.connectionStep,
      "error",
      getErrorMessage(error, locale),
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
    return { success: false, error: getErrorMessage(error, config.locale) };
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
    return { success: false, error: getErrorMessage(error, config.locale) };
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
    return { success: false, error: getErrorMessage(error, config.locale) };
  }
}
