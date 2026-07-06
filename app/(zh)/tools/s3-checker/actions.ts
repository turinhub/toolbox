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
import { englishLocale } from "@/i18n/config";

export interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
  path: string;
  region?: string;
  usePathStyle?: boolean;
  locale?: string;
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

const getErrorMessage = (error: any, locale = "zh-CN"): string => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return locale === englishLocale ? "Unknown error" : "未知错误";
};

const zhNumberFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2,
});

// 格式化文件大小
const formatFileSize = (bytes?: number) => {
  if (bytes === undefined) return "-";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${zhNumberFormatter.format(bytes / Math.pow(k, i))} ${sizes[i]}`;
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
  let {
    endpoint,
    accessKey,
    secretKey,
    bucket,
    path,
    region,
    usePathStyle,
    locale = "zh-CN",
  } = config;
  const isEnglish = locale === englishLocale;
  const copy = isEnglish
    ? {
        optimizedStep: "Config optimization",
        optimizedMessage:
          "Detected that the Endpoint includes the Bucket name. Optimized to: {endpoint}",
        initStep: "Initialize connection",
        initSuccess: "Server-side client initialized",
        bucketStep: "Bucket connection test",
        bucketSuccess: "Bucket exists and is reachable",
        endpointRootCause:
          "Endpoint may be incorrect. Use only protocol and domain, such as https://oss-cn-hangzhou.aliyuncs.com. Do not include bucket name or sub-path.",
        endpointPathError: "Connection failed: endpoint may include extra path",
        listStep: "List permission test",
        listSuccess: "List permission verified",
        filesFound: ", found {count} files",
        bucketEmpty: ", bucket is empty",
        writeStep: "Write permission test",
        testContent: "S3 server-side connectivity test file",
        writeSuccess: "Write permission verified",
        readStep: "Read permission test",
        readSuccess: "Read permission verified",
        deleteStep: "Delete permission test",
        deleteSuccess: "Delete permission verified",
        pathStep: "Path access test",
        pathSuccess: 'Path "{path}" access succeeded',
        pathEmpty: ", path is empty",
        connectionStep: "Connection test",
        serverException: "Server-side test exception:",
      }
    : {
        optimizedStep: "配置优化",
        optimizedMessage:
          "检测到 Endpoint 包含 Bucket 名称，已自动优化为: {endpoint}",
        initStep: "初始化连接",
        initSuccess: "服务端客户端初始化成功",
        bucketStep: "Bucket连接测试",
        bucketSuccess: "Bucket 连接正常且存在",
        endpointRootCause:
          "Endpoint 格式可能不正确。请确保 Endpoint 仅包含协议和域名（如 https://oss-cn-hangzhou.aliyuncs.com），不要包含 Bucket 名称或子路径。",
        endpointPathError: "连接失败：Endpoint 可能包含多余路径",
        listStep: "列表权限测试",
        listSuccess: "列表权限验证通过",
        filesFound: "，获取到 {count} 个文件",
        bucketEmpty: "，存储桶为空",
        writeStep: "写入权限测试",
        testContent: "S3服务端接口连通性测试文件",
        writeSuccess: "写入权限验证通过",
        readStep: "读取权限测试",
        readSuccess: "读取权限验证通过",
        deleteStep: "删除权限测试",
        deleteSuccess: "删除权限验证通过",
        pathStep: "路径访问测试",
        pathSuccess: "路径 \"{path}\" 访问成功",
        pathEmpty: "，路径为空",
        connectionStep: "连接测试",
        serverException: "服务端测试发生异常:",
      };

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
      copy.optimizedStep,
      "success",
      copy.optimizedMessage.replace("{endpoint}", endpoint)
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
    addResult(copy.initStep, "success", copy.initSuccess);

    // Bucket连接可用性测试
    try {
      await s3Client.send(
        new HeadBucketCommand({
          Bucket: bucket,
        })
      );
      addResult(copy.bucketStep, "success", copy.bucketSuccess);
    } catch (error: any) {
      const details = extractErrorDetails(error);

      // 特殊处理 NoSuchKey
      if (details["Code"] === "NoSuchKey" || error.name === "NoSuchKey") {
        details["Possible Root Cause"] =
          copy.endpointRootCause;
        addResult(
          copy.bucketStep,
          "error",
          copy.endpointPathError,
          undefined,
          details
        );
      } else {
        addResult(
          copy.bucketStep,
          "error",
          getErrorMessage(error, locale),
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
      let resultMessage = copy.listSuccess;
      if (fileList.length > 0) {
        resultMessage += copy.filesFound.replace(
          "{count}",
          String(fileList.length)
        );
      } else {
        resultMessage += copy.bucketEmpty;
      }

      addResult(copy.listStep, "success", resultMessage, fileList);
    } catch (error) {
      addResult(
        copy.listStep,
        "error",
        getErrorMessage(error, locale),
        undefined,
        extractErrorDetails(error)
      );
      // List 失败不中断
    }

    // 测试写入权限
    try {
      const testKey = `test-server-${Date.now()}.txt`;
      const testContent = copy.testContent;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: testKey,
          Body: testContent,
          ContentType: "text/plain",
        })
      );
      addResult(copy.writeStep, "success", copy.writeSuccess);

      // 测试读取权限
      try {
        const getResult = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: testKey,
          })
        );
        if (getResult.$metadata.httpStatusCode === 200) {
          addResult(copy.readStep, "success", copy.readSuccess);
        } else {
          throw new Error(`HTTP Status: ${getResult.$metadata.httpStatusCode}`);
        }
      } catch (error) {
        addResult(
          copy.readStep,
          "error",
          getErrorMessage(error, locale),
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
        copy.writeStep,
        "error",
        getErrorMessage(error, locale),
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
        let pathMessage = copy.pathSuccess.replace("{path}", path);
        if (pathFiles.length > 0) {
          pathMessage += copy.filesFound.replace(
            "{count}",
            String(pathFiles.length)
          );
        } else {
          pathMessage += copy.pathEmpty;
        }
        addResult(copy.pathStep, "success", pathMessage, pathFiles);
      } catch (error) {
        addResult(
          copy.pathStep,
          "error",
          getErrorMessage(error, locale),
          undefined,
          extractErrorDetails(error)
        );
      }
    }

    return results;
  } catch (error) {
    console.error(copy.serverException, error);
    addResult(
      copy.connectionStep,
      "error",
      getErrorMessage(error, locale),
      undefined,
      extractErrorDetails(error)
    );
    return results;
  }
}
