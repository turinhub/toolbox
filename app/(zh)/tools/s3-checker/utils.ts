import { S3Error } from "./types";
import { englishLocale } from "@/i18n/config";

const getNumberFormatter = (locale = "zh-CN") =>
  new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  });

/**
 * 格式化文件大小
 */
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

/**
 * 获取友好的错误信息
 */
export function getErrorMessage(
  error: S3Error,
  bucket: string,
  _endpoint: string,
  locale = "zh-CN"
): string {
  console.error("详细错误信息:", error);
  const isEnglish = locale === englishLocale;

  // 处理 CORS 相关的错误
  // 浏览器可能会阻止跨域请求，导致无法捕获完整的错误信息
  if (error instanceof TypeError) {
    // Failed to fetch 是最常见的 CORS 错误
    if (error.message.includes("Failed to fetch")) {
      if (isEnglish) {
        return "CORS error\n\nThe browser blocked the cross-origin request. Possible causes:\n1. The S3 service has no CORS policy for this origin\n2. The Endpoint URL is incorrect\n3. Network connectivity issue\n\nSolution:\n- Switch to Server proxy mode (recommended)\n- Or configure the S3 CORS policy to allow this site";
      }
      return "❌ CORS 跨域错误\n\n浏览器阻止了跨域请求，可能原因：\n1. S3 服务端未配置 CORS 策略\n2. Endpoint URL 格式不正确\n3. 网络连接问题\n\n💡 解决方案：\n• 切换到「服务端代理模式」（推荐）\n• 或在 S3 服务端配置 CORS 策略允许此域名访问";
    }
    // NetworkError 是另一种 CORS 表现
    if (error.message.includes("NetworkError")) {
      if (isEnglish) {
        return "Network error\n\nThis may be caused by CORS restrictions. Make sure the S3 service allows cross-origin requests.\n\nSolution: switch to Server proxy mode to avoid this issue.";
      }
      return "❌ 网络错误\n\n可能是由于跨域 (CORS) 限制导致，请确保 S3 服务允许跨域请求。\n\n💡 解决方案：切换到「服务端代理模式」可避免此问题。";
    }
    // 任何其他 TypeError 都可能是 CORS 相关的
    if (isEnglish) {
      return `Network request failed\n\nError: ${error.message}\n\nThis may be caused by CORS. Switch to Server proxy mode.`;
    }
    return `⚠️ 网络请求失败\n\n错误：${error.message}\n\n💡 这可能是 CORS 跨域问题导致的。建议切换到「服务端代理模式」。`;
  }

  if (error && typeof error === "object" && "name" in error) {
    const s3Error = error as { name: string; message?: string };
    switch (s3Error.name) {
      case "NoSuchBucket":
        if (isEnglish) return `Bucket "${bucket}" does not exist`;
        return `存储桶 "${bucket}" 不存在`;
      case "AccessDenied":
        if (isEnglish) {
          return "Access denied. Check your credentials and permissions.";
        }
        return "访问被拒绝，请检查您的访问凭证和权限";
      case "InvalidAccessKeyId":
        if (isEnglish) return "Access Key is invalid";
        return "Access Key 无效";
      case "SignatureDoesNotMatch":
        if (isEnglish) return "Secret Key is invalid or signature mismatch";
        return "Secret Key 无效或签名不匹配";
      case "NetworkingError":
        if (isEnglish) return "Network error. Check whether the Endpoint is correct.";
        return "网络错误，请检查您的 Endpoint 是否正确";
      case "ConnectionTimeoutError":
        if (isEnglish) return "Connection timed out. Check whether the Endpoint is reachable.";
        return "连接超时，请检查 Endpoint 是否可访问";
      default:
        return `${s3Error.name}: ${s3Error.message || (isEnglish ? "Unknown error" : "未知错误")}`;
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("ENOTFOUND")) {
      if (isEnglish) return "Endpoint domain cannot be resolved. Check the address.";
      return "Endpoint 域名无法解析，请检查是否正确";
    }
    if (error.message.includes("ECONNREFUSED")) {
      if (isEnglish) return "Endpoint connection was refused. Check the address and port.";
      return "Endpoint 连接被拒绝，请检查地址和端口是否正确";
    }
    if (error.message.includes("NetworkError")) {
      if (isEnglish) {
        return "Network error. This may be caused by CORS restrictions. Make sure the S3 service allows cross-origin requests.";
      }
      return "网络错误，可能是由于跨域 (CORS) 限制导致，请确保 S3 服务允许跨域请求";
    }
    return `${error.name || (isEnglish ? "Error" : "错误")}: ${error.message}`;
  }

  return isEnglish
    ? "Unknown error. Check the console for details."
    : "未知错误，请查看控制台获取详细信息";
}

/**
 * 提取详细的错误信息
 */
export function extractErrorDetails(
  error: any,
  endpoint: string,
  locale = "zh-CN"
): Record<string, string> {
  const details: Record<string, string> = {};
  const isEnglish = locale === englishLocale;

  if (typeof error === "object" && error !== null) {
    // 提取 AWS SDK metadata
    if (error.$metadata) {
      if (error.$metadata.requestId)
        details["RequestId"] = error.$metadata.requestId;
      if (error.$metadata.extendedRequestId)
        details["HostId"] = error.$metadata.extendedRequestId;
      if (error.$metadata.httpStatusCode)
        details["HTTP Status"] = error.$metadata.httpStatusCode.toString();
    }

    // 提取常见错误属性
    if (error.Code) details["Code"] = error.Code;
    if (error.name) details["Error Name"] = error.name;

    // 保留原始 Message 供参考
    if (error.message) details["Message"] = error.message;

    // 尝试查找其他可能的字段
    if (error.region) details["Region"] = error.region;
    if (error.hostname) details["Hostname"] = error.hostname;

    // 尝试提取阿里云 OSS EC 码
    // 有些错误信息可能包含 "EC: xxxx"
    if (typeof error.message === "string") {
      const ecMatch = error.message.match(/EC[:\s]+([A-Za-z0-9-]+)/);
      if (ecMatch) {
        details["EC"] = ecMatch[1];
      }

      // 针对 Failed to fetch 的特殊诊断
      if (error.name === "TypeError" && error.message === "Failed to fetch") {
        // 1. 混合内容检查
        if (
          typeof window !== "undefined" &&
          window.location.protocol === "https:" &&
          endpoint.startsWith("http:")
        ) {
          details["Mixed Content Error"] =
            isEnglish
              ? "The current page is HTTPS, so the browser blocks direct HTTP resources (mixed content). Use an HTTPS Endpoint."
              : "当前页面为 HTTPS，浏览器禁止直接访问 HTTP 资源（混合内容）。请使用 HTTPS Endpoint。";
        }

        // 2. 环境信息
        if (typeof window !== "undefined") {
          details["Browser Origin"] = window.location.origin;
        }
        details["Target Endpoint"] = endpoint;

        // 3. CORS / 证书提示
        details["Possible Causes"] =
          isEnglish
            ? "1. CORS is not configured\n2. SSL certificate is invalid (for example, self-signed)\n3. Network is unreachable\n4. Browser extension blocked the request"
            : "1. CORS 跨域未配置\n2. SSL 证书无效(如自签名证书)\n3. 网络不通\n4. 浏览器插件拦截";
        details["Action Required"] =
          isEnglish
            ? "The browser hides the specific network error. Open Console/Network in developer tools to inspect the red error message."
            : "具体的网络错误被浏览器隐藏。请按 F12 打开控制台(Console/Network)查看红色的报错信息以确定具体原因。";

        // 4. 添加推荐解决方案
        details["Recommended Solution"] =
          isEnglish
            ? "Switch to Server proxy mode to avoid CORS issues. This is the simplest solution."
            : "切换到「服务端代理模式」可以避免 CORS 问题，这是最简单的解决方案。";
      }

      // 处理其他网络错误
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        details["Error Type"] = "Network/CORS Error";
        if (typeof window !== "undefined") {
          details["Current Page"] = window.location.origin;
        }
        details["Target URL"] = endpoint;
        details["Help"] = isEnglish
          ? "Check the browser console for detailed error information."
          : "请检查浏览器控制台（按 F12）查看详细的错误信息。";
      }
    }
  }

  return details;
}

/**
 * 验证 URL 格式
 */
export function validateEndpoint(value: string): boolean {
  if (!value) {
    return false;
  }

  try {
    // 检查是否是有效的 URL
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成 Endpoint 错误信息
 */
export function getEndpointError(value: string, locale = "zh-CN"): string {
  const isEnglish = locale === englishLocale;
  if (!value) {
    return isEnglish ? "Endpoint is required" : "Endpoint 不能为空";
  }
  return isEnglish
    ? "Enter a valid URL, such as https://s3.example.com"
    : "请输入有效的 URL，例如 https://s3.example.com";
}
