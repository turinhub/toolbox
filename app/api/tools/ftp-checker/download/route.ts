import { NextRequest, NextResponse } from "next/server";
import { PassThrough, Readable } from "stream";
import {
  closeSftpQuietly,
  connectFtp,
  connectSftp,
  getErrorMessage,
} from "@/app/tools/ftp-checker/server";
import { consumeTransferToken } from "@/app/tools/ftp-checker/transfer-token-store";

export const runtime = "nodejs";

function getAsciiFileName(fileName: string) {
  return fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.json({ error: "缺少下载令牌" }, { status: 400 });
  }

  const payload = consumeTransferToken(token, "download");
  if (!payload) {
    return NextResponse.json(
      { error: "下载令牌无效或已过期" },
      { status: 404 }
    );
  }

  const stream = new PassThrough();
  const fileName = payload.fileName || "download.bin";

  try {
    let fileSize: number | undefined;
    let closeConnection: () => Promise<void>;
    let startTransfer: Promise<unknown>;

    if (payload.config.protocol === "sftp") {
      const sftp = await connectSftp(payload.config);
      const stat = await sftp.stat(payload.remotePath);
      if (typeof stat.size === "number") {
        fileSize = stat.size;
      }
      closeConnection = () => closeSftpQuietly(sftp);
      startTransfer = sftp.get(payload.remotePath, stream);
    } else {
      const client = await connectFtp(payload.config);
      try {
        fileSize = await client.size(payload.remotePath);
      } catch {
        fileSize = undefined;
      }
      closeConnection = async () => {
        client.close();
      };
      startTransfer = client.downloadTo(stream, payload.remotePath);
    }

    const abortTransfer = async () => {
      stream.destroy(new Error("下载已取消"));
      await closeConnection();
    };

    request.signal.addEventListener(
      "abort",
      () => {
        void abortTransfer();
      },
      { once: true }
    );

    void startTransfer
      .catch(error => {
        stream.destroy(
          error instanceof Error ? error : new Error(getErrorMessage(error))
        );
      })
      .finally(() => {
        void closeConnection();
      });

    const headers = new Headers({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${getAsciiFileName(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store",
    });
    if (typeof fileSize === "number" && Number.isFinite(fileSize)) {
      headers.set("Content-Length", String(fileSize));
    }

    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
      headers,
    });
  } catch (error) {
    stream.destroy();
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
