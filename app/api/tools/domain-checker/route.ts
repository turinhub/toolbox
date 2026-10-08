import { NextResponse } from "next/server";
import { createDomainReport } from "@/lib/domain-checker/checks";
import { DomainCheckError } from "@/lib/domain-checker/input";
import { isHumanVerified, isTurnstileProtectionEnabled } from "@/lib/turnstile";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  if (isTurnstileProtectionEnabled() && !isHumanVerified(request)) {
    return NextResponse.json(
      { error: "humanVerificationRequired" },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }
  try {
    // 限制流式请求体，不能仅依赖可伪造的 Content-Length。
    const reader = request.body?.getReader();
    if (!reader) throw new DomainCheckError("invalidInput");
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 4096) {
          await reader.cancel();
          throw new DomainCheckError("invalidInput");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new DomainCheckError("invalidInput");
    }
    if (
      !body ||
      typeof body !== "object" ||
      !("input" in body) ||
      typeof body.input !== "string"
    ) {
      throw new DomainCheckError("invalidInput");
    }
    return NextResponse.json(await createDomainReport(body.input), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof DomainCheckError ? error.code : "networkFailed",
      },
      { status: error instanceof DomainCheckError ? 400 : 500 }
    );
  }
}
