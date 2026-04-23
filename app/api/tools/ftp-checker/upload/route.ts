import { NextRequest, NextResponse } from "next/server";
import {
  closeSftpQuietly,
  connectFtp,
  connectSftp,
  getErrorMessage,
  toNodeReadable,
} from "@/app/tools/ftp-checker/server";
import { consumeTransferToken } from "@/app/tools/ftp-checker/transfer-token-store";
import { joinPath, MAX_UPLOAD_SIZE } from "@/app/tools/ftp-checker/utils";

export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ error: "缺少上传令牌" }, { status: 400 });
  }

  const payload = consumeTransferToken(token, "upload");
  if (!payload) {
    return NextResponse.json(
      { error: "上传令牌无效或已过期" },
      { status: 404 }
    );
  }

  if (!request.body) {
    return NextResponse.json({ error: "缺少上传内容" }, { status: 400 });
  }

  const requestSize = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(requestSize) && requestSize > MAX_UPLOAD_SIZE) {
    return NextResponse.json(
      {
        error: `文件大小超过限制（最大 ${Math.floor(MAX_UPLOAD_SIZE / 1024 / 1024)}MB）`,
      },
      { status: 413 }
    );
  }

  if (payload.fileSize && requestSize && requestSize !== payload.fileSize) {
    return NextResponse.json(
      { error: "上传文件大小与令牌信息不匹配" },
      { status: 400 }
    );
  }

  const fullPath = joinPath(payload.remotePath, payload.fileName);

  try {
    const stream = toNodeReadable(request.body);
    if (payload.config.protocol === "sftp") {
      const sftp = await connectSftp(payload.config);
      try {
        await sftp.put(stream, fullPath);
      } finally {
        await closeSftpQuietly(sftp);
      }
    } else {
      const client = await connectFtp(payload.config);
      try {
        await client.uploadFrom(stream, fullPath);
      } finally {
        client.close();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
