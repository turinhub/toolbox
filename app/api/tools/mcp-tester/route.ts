import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  executeMcpTesterRequest,
  McpTesterClientError,
} from "@/lib/mcp-tester/client";
import {
  MCP_MAX_REQUEST_BYTES,
  McpSecurityError,
} from "@/lib/mcp-tester/security";
import type {
  McpTesterFailure,
  McpTesterRequest,
} from "@/lib/mcp-tester/types";
import {
  isHumanVerificationConfigured,
  isHumanVerified,
} from "@/lib/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const headerSchema = z.object({
  name: z.string().max(64),
  value: z.string().max(4096),
});

const baseSchema = z.object({
  endpoint: z.string().url().max(2048),
  headers: z.array(headerSchema).max(10).default([]),
  locale: z.enum(["zh-CN", "en"]).optional(),
});

const requestSchema = z.discriminatedUnion("action", [
  baseSchema.extend({ action: z.literal("inspect") }),
  baseSchema.extend({
    action: z.literal("call-tool"),
    name: z.string().min(1).max(256),
    arguments: z.record(z.unknown()),
  }),
  baseSchema.extend({
    action: z.literal("read-resource"),
    uri: z.string().min(1).max(4096),
  }),
  baseSchema.extend({
    action: z.literal("get-prompt"),
    name: z.string().min(1).max(256),
    arguments: z.record(z.string()).optional(),
  }),
]);

type RateLimitEntry = {
  count: number;
  resetAt: number;
  active: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_MAX_CONCURRENT = 3;
const rateLimits = new Map<string, RateLimitEntry>();

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function acquireRateLimit(ip: string) {
  const now = Date.now();
  if (rateLimits.size > 1000) {
    for (const [key, entry] of rateLimits) {
      if (entry.resetAt <= now && entry.active === 0) rateLimits.delete(key);
    }
  }

  const current = rateLimits.get(ip);
  const entry =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS, active: 0 }
      : current;

  if (
    entry.count >= RATE_LIMIT_MAX_REQUESTS ||
    entry.active >= RATE_LIMIT_MAX_CONCURRENT
  ) {
    return null;
  }

  entry.count += 1;
  entry.active += 1;
  rateLimits.set(ip, entry);
  return () => {
    entry.active = Math.max(0, entry.active - 1);
  };
}

function failure(
  status: number,
  code: string,
  message: string,
  details?: string
) {
  const body: McpTesterFailure = {
    ok: false,
    error: {
      code,
      message,
      details,
    },
  };
  return NextResponse.json(body, { status });
}

function humanVerificationRequired(request: NextRequest) {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.MCP_TESTER_BYPASS_HUMAN_VERIFICATION === "true"
  ) {
    return false;
  }
  return !isHumanVerified(request);
}

function statusForError(error: unknown) {
  if (error instanceof McpSecurityError) return 403;
  if (error instanceof McpTesterClientError) {
    return error.code === "UPSTREAM_TIMEOUT" ? 408 : 502;
  }
  return 500;
}

export async function POST(request: NextRequest) {
  const configuredLength = Number(request.headers.get("content-length") || 0);
  if (configuredLength > MCP_MAX_REQUEST_BYTES) {
    return failure(413, "REQUEST_TOO_LARGE", "请求内容超过 256 KB 限制");
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return failure(400, "INVALID_REQUEST", "无法读取请求内容");
  }
  if (Buffer.byteLength(rawBody, "utf8") > MCP_MAX_REQUEST_BYTES) {
    return failure(413, "REQUEST_TOO_LARGE", "请求内容超过 256 KB 限制");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return failure(400, "INVALID_JSON", "请求内容不是有效 JSON");
  }

  const parsed = requestSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return failure(
      400,
      "INVALID_REQUEST",
      "请求参数不完整或格式不正确",
      parsed.error.issues[0]?.message
    );
  }

  const bypassEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.MCP_TESTER_BYPASS_HUMAN_VERIFICATION === "true";
  if (!isHumanVerificationConfigured() && !bypassEnabled) {
    return failure(
      503,
      "HUMAN_VERIFICATION_UNAVAILABLE",
      "MCP 测试服务尚未配置人机验证"
    );
  }
  if (humanVerificationRequired(request)) {
    return failure(403, "HUMAN_VERIFICATION_REQUIRED", "请先完成人机验证");
  }

  const release = acquireRateLimit(getClientIp(request));
  if (!release) {
    return failure(429, "RATE_LIMITED", "请求过于频繁，请稍后再试");
  }

  try {
    const result = await executeMcpTesterRequest(
      parsed.data as McpTesterRequest
    );
    return NextResponse.json(result);
  } catch (error) {
    const status = statusForError(error);
    const code =
      error instanceof McpSecurityError || error instanceof McpTesterClientError
        ? error.code
        : "INTERNAL_ERROR";
    const message =
      error instanceof Error ? error.message : "MCP 测试服务发生未知错误";
    return failure(status, code, message);
  } finally {
    release();
  }
}
