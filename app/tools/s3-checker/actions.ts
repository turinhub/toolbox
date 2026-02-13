"use server";

import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  _Object as S3Object,
} from "@aws-sdk/client-s3";

export interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  path: string;
  region?: string;
  usePathStyle?: boolean;
}

export interface TestResult {
  step: string;
  status: "success" | "error" | "pending";
  message?: string;
  data?: any[];
  errorDetails?: Record<string, string>;
}

const extractErrorDetails = (error: any): Record<string, string> => {
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
    if (typeof error.message === "string") {
      const ecMatch = error.message.match(/EC[:\s]+([A-Za-z0-9-]+)/);
      if (ecMatch) {
        details["EC"] = ecMatch[1];
      }
    }
  }

  return details;
};

const getErrorMessage = (error: any): string => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "未知错误";
};

// 格式化文件大小
const formatFileSize = (bytes?: number) => {
  if (bytes === undefined) return "-";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const normalizeEndpoint = (endpoint: string, bucket: string): string => {
  try {
    let urlStr = endpoint;
    // 确保有协议，如果没有默认为 https
    if (!/^https?:\/\//i.test(urlStr)) {
      urlStr = "https://" + urlStr;
    }

    const url = new URL(urlStr);
    const host = url.hostname;

    // 检查 Host 是否以 bucket. 开头 (Virtual Hosted Style 重复)
    // 仅当 bucket 存在且不为空时检查
    if (bucket && host.toLowerCase().startsWith(`${bucket.toLowerCase()}.`)) {
      // 移除 bucket. 前缀
      const newHost = host.slice(bucket.length + 1);
      url.hostname = newHost;
      // 返回新的 URL，移除末尾斜杠
      return url.toString().replace(/\/$/, "");
    }

    return endpoint;
  } catch (e) {
    return endpoint;
  }
};

export async function checkS3ConnectionServer(
  config: S3Config
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let { endpoint, accessKey, secretKey, bucket, path, region, usePathStyle } =
    config;

  // 自动优化 Endpoint
  const originalEndpoint = endpoint;
  endpoint = normalizeEndpoint(endpoint, bucket);

  const addResult = (
    step: string,
    status: "success" | "error" | "pending",
    message?: string,
    data?: any[],
    errorDetails?: Record<string, string>
  ) => {
    // 在服务端，我们直接追加结果，因为我们是一次性返回（或者可以使用流式传输，但这里简单起见一次性返回）
    // 为了模拟前端的逐步更新体验，我们其实无法做到（除非使用 Stream），所以这里我们按顺序执行完所有步骤后返回结果数组
    // 但为了兼容前端展示，我们记录每一步的结果
    results.push({ step, status, message, data, errorDetails });
  };

  if (originalEndpoint !== endpoint) {
    addResult(
      "配置优化",
      "success",
      `检测到 Endpoint 包含 Bucket 名称，已自动优化为: ${endpoint}`
    );
  }

  try {
    // 初始化 S3 客户端
    const s3Client = new S3Client({
      endpoint,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: usePathStyle,
      region: region || "auto",
    });
    addResult("初始化连接", "success", "服务端客户端初始化成功");

    // Bucket连接可用性测试
    try {
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: bucket,
        })
      );
      addResult("Bucket连接测试", "success", "Bucket 连接正常且存在");
    } catch (error: any) {
      const details = extractErrorDetails(error);

      // 特殊处理 NoSuchKey
      if (details["Code"] === "NoSuchKey" || error.name === "NoSuchKey") {
        details["Possible Root Cause"] =
          "Endpoint 格式可能不正确。请确保 Endpoint 仅包含协议和域名（如 https://oss-cn-hangzhou.aliyuncs.com），不要包含 Bucket 名称或子路径。";
        addResult(
          "Bucket连接测试",
          "error",
          "连接失败：Endpoint 可能包含多余路径",
          undefined,
          details
        );
      } else {
        addResult(
          "Bucket连接测试",
          "error",
          getErrorMessage(error),
          undefined,
          details
        );
      }

      // Bucket 连接失败，直接返回
      return results;
    }

    // 测试列表对象权限
    try {
      const listResult = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          MaxKeys: 10,
        })
      );

      const fileList = listResult.Contents || [];
      // 序列化 fileList，确保 Date 对象可以传输（Next.js Server Actions 支持 Date，但最好确认一下）
      // 这里不做特殊处理，直接传
      let resultMessage = "列表权限验证通过";
      if (fileList.length > 0) {
        resultMessage += `，获取到 ${fileList.length} 个文件`;
      } else {
        resultMessage += "，存储桶为空";
      }

      addResult("列表权限测试", "success", resultMessage, fileList);
    } catch (error) {
      addResult(
        "列表权限测试",
        "error",
        getErrorMessage(error),
        undefined,
        extractErrorDetails(error)
      );
      // List 失败不中断
    }

    // 测试写入权限
    try {
      const testKey = `test-server-${Date.now()}.txt`;
      const testContent = "S3服务端接口连通性测试文件";
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: testKey,
          Body: testContent,
          ContentType: "text/plain",
        })
      );
      addResult("写入权限测试", "success", "写入权限验证通过");

      // 测试读取权限
      try {
        const getResult = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: testKey,
          })
        );
        if (getResult.$metadata.httpStatusCode === 200) {
          addResult("读取权限测试", "success", "读取权限验证通过");
        } else {
          throw new Error(`HTTP Status: ${getResult.$metadata.httpStatusCode}`);
        }
      } catch (error) {
        addResult(
          "读取权限测试",
          "error",
          getErrorMessage(error),
          undefined,
          extractErrorDetails(error)
        );
      }

      // 清理测试文件
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: testKey,
          })
        );
        addResult("删除权限测试", "success", "删除权限验证通过");
      } catch (error) {
        addResult(
          "删除权限测试",
          "error",
          getErrorMessage(error),
          undefined,
          extractErrorDetails(error)
        );
      }
    } catch (error) {
      addResult(
        "写入权限测试",
        "error",
        getErrorMessage(error),
        undefined,
        extractErrorDetails(error)
      );
    }

    // 测试指定路径访问
    if (path) {
      try {
        const pathResult = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: path,
            MaxKeys: 10,
          })
        );
        const pathFiles = pathResult.Contents || [];
        let pathMessage = `路径 "${path}" 访问成功`;
        if (pathFiles.length > 0) {
          pathMessage += `，获取到 ${pathFiles.length} 个文件`;
        } else {
          pathMessage += "，路径为空";
        }
        addResult("路径访问测试", "success", pathMessage, pathFiles);
      } catch (error) {
        addResult(
          "路径访问测试",
          "error",
          getErrorMessage(error),
          undefined,
          extractErrorDetails(error)
        );
      }
    }

    return results;
  } catch (error) {
    console.error("服务端测试发生异常:", error);
    addResult(
      "连接测试",
      "error",
      getErrorMessage(error),
      undefined,
      extractErrorDetails(error)
    );
    return results;
  }
}
