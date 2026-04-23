import { NextRequest, NextResponse } from "next/server";
import { createTransferToken } from "@/app/tools/ftp-checker/transfer-token-store";
import { MAX_UPLOAD_SIZE } from "@/app/tools/ftp-checker/utils";
import type { FtpConfig } from "@/app/tools/ftp-checker/types";

interface UploadTokenRequest {
  config?: FtpConfig;
  remotePath?: string;
  fileName?: string;
  fileSize?: number;
}

function isValidFtpConfig(config: unknown): config is FtpConfig {
  if (typeof config !== "object" || config === null) return false;
  const value = config as Record<string, unknown>;
  return (
    typeof value.protocol === "string" &&
    typeof value.host === "string" &&
    typeof value.port === "number" &&
    typeof value.username === "string" &&
    typeof value.password === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UploadTokenRequest;
    const remotePath = (body.remotePath ?? "").trim() || "/";
    const fileName = (body.fileName ?? "").trim();
    const fileSize = Number(body.fileSize ?? 0);

    if (!isValidFtpConfig(body.config)) {
      return NextResponse.json({ error: "连接配置无效" }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ error: "缺少文件名" }, { status: 400 });
    }

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: "文件大小无效" }, { status: 400 });
    }

    if (fileSize > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        {
          error: `文件大小超过限制（最大 ${Math.floor(MAX_UPLOAD_SIZE / 1024 / 1024)}MB）`,
        },
        { status: 413 }
      );
    }

    const token = createTransferToken({
      kind: "upload",
      config: body.config,
      remotePath,
      fileName,
      fileSize,
    });

    return NextResponse.json({
      success: true,
      uploadUrl: `/api/tools/ftp-checker/upload?token=${encodeURIComponent(token)}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "创建上传令牌失败",
      },
      { status: 500 }
    );
  }
}
