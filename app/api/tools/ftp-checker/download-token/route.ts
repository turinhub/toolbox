import { NextRequest, NextResponse } from "next/server";
import { createTransferToken } from "@/app/tools/ftp-checker/transfer-token-store";
import { getBaseName } from "@/app/tools/ftp-checker/utils";
import type { FtpConfig } from "@/app/tools/ftp-checker/types";

interface DownloadTokenRequest {
  config?: FtpConfig;
  remotePath?: string;
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
    const body = (await request.json()) as DownloadTokenRequest;
    const remotePath = (body.remotePath ?? "").trim();

    if (!isValidFtpConfig(body.config)) {
      return NextResponse.json({ error: "连接配置无效" }, { status: 400 });
    }

    if (!remotePath) {
      return NextResponse.json({ error: "缺少下载路径" }, { status: 400 });
    }

    const token = createTransferToken({
      kind: "download",
      config: body.config,
      remotePath,
      fileName: getBaseName(remotePath),
    });

    return NextResponse.json({
      success: true,
      downloadUrl: `/api/tools/ftp-checker/download?token=${encodeURIComponent(token)}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "创建下载令牌失败",
      },
      { status: 500 }
    );
  }
}
