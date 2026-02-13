import { S3Error } from "./types";

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined) return "-";
  if (bytes === 0) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 获取友好的错误信息
 */
export function getErrorMessage(
  error: S3Error,
  bucket: string,
  _endpoint: string
): string {
  console.error("详细错误信息:", error);

  // 处理 CORS 相关的错误
  // 浏览器可能会阻止跨域请求，导致无法捕获完整的错误信息
  if (error instanceof TypeError) {
    // Failed to fetch 是最常见的 CORS 错误
    if (error.message.includes("Failed to fetch")) {
      return "❌ CORS 跨域错误\n\n浏览器阻止了跨域请求，可能原因：\n1. S3 服务端未配置 CORS 策略\n2. Endpoint URL 格式不正确\n3. 网络连接问题\n\n💡 解决方案：\n• 切换到「服务端代理模式」（推荐）\n• 或在 S3 服务端配置 CORS 策略允许此域名访问";
    }
    // NetworkError 是另一种 CORS 表现
    if (error.message.includes("NetworkError")) {
      return "❌ 网络错误\n\n可能是由于跨域 (CORS) 限制导致，请确保 S3 服务允许跨域请求。\n\n💡 解决方案：切换到「服务端代理模式」可避免此问题。";
    }
    // 任何其他 TypeError 都可能是 CORS 相关的
    return `⚠️ 网络请求失败\n\n错误：${error.message}\n\n💡 这可能是 CORS 跨域问题导致的。建议切换到「服务端代理模式」。`;
  }

  if (error && typeof error === "object" && "name" in error) {
    const s3Error = error as { name: string; message?: string };
    switch (s3Error.name) {
      case "NoSuchBucket":
        return `存储桶 "${bucket}" 不存在`;
      case "AccessDenied":
        return "访问被拒绝，请检查您的访问凭证和权限";
      case "InvalidAccessKeyId":
        return "Access Key 无效";
      case "SignatureDoesNotMatch":
        return "Secret Key 无效或签名不匹配";
      case "NetworkingError":
        return "网络错误，请检查您的 Endpoint 是否正确";
      case "ConnectionTimeoutError":
        return "连接超时，请检查 Endpoint 是否可访问";
      default:
        return `${s3Error.name}: ${s3Error.message || "未知错误"}`;
    }
  }

  if (error instanceof Error) {
    if (error.message.includes("ENOTFOUND")) {
      return "Endpoint 域名无法解析，请检查是否正确";
    }
    if (error.message.includes("ECONNREFUSED")) {
      return "Endpoint 连接被拒绝，请检查地址和端口是否正确";
    }
    if (error.message.includes("NetworkError")) {
      return "网络错误，可能是由于跨域 (CORS) 限制导致，请确保 S3 服务允许跨域请求";
    }
    return `${error.name || "错误"}: ${error.message}`;
  }

  return "未知错误，请查看控制台获取详细信息";
}

/**
 * 提取详细的错误信息
 */
export function extractErrorDetails(
  error: any,
  endpoint: string
): Record<string, string> {
  const details: Record<string, string> = {};

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
            "当前页面为 HTTPS，浏览器禁止直接访问 HTTP 资源（混合内容）。请使用 HTTPS Endpoint。";
        }

        // 2. 环境信息
        if (typeof window !== "undefined") {
          details["Browser Origin"] = window.location.origin;
        }
        details["Target Endpoint"] = endpoint;

        // 3. CORS / 证书提示
        details["Possible Causes"] =
          "1. CORS 跨域未配置\n2. SSL 证书无效(如自签名证书)\n3. 网络不通\n4. 浏览器插件拦截";
        details["Action Required"] =
          "具体的网络错误被浏览器隐藏。请按 F12 打开控制台(Console/Network)查看红色的报错信息以确定具体原因。";

        // 4. 添加推荐解决方案
        details["Recommended Solution"] =
          "切换到「服务端代理模式」可以避免 CORS 问题，这是最简单的解决方案。";
      }

      // 处理其他网络错误
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        details["Error Type"] = "Network/CORS Error";
        if (typeof window !== "undefined") {
          details["Current Page"] = window.location.origin;
        }
        details["Target URL"] = endpoint;
        details["Help"] = "请检查浏览器控制台（按 F12）查看详细的错误信息。";
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
export function getEndpointError(value: string): string {
  if (!value) {
    return "Endpoint 不能为空";
  }
  return "请输入有效的 URL，例如 https://s3.example.com";
}
