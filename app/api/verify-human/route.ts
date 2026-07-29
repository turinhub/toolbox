import { NextRequest, NextResponse } from "next/server";
import {
  createHumanVerificationToken,
  humanVerificationCookieName,
  humanVerificationTtlSeconds,
  validateTurnstileToken,
} from "@/lib/turnstile";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // 验证必要的字段
    if (!token) {
      return NextResponse.json(
        { message: "验证令牌是必需的" },
        { status: 400 }
      );
    }

    // 验证 Turnstile 令牌
    const isValid = await validateTurnstileToken(token);

    if (!isValid) {
      return NextResponse.json(
        { message: "人机验证失败，请重试" },
        { status: 400 }
      );
    }

    const verificationToken = createHumanVerificationToken();
    const response = NextResponse.json(
      { message: "验证成功", verified: true },
      { status: 200 }
    );

    response.cookies.set({
      name: humanVerificationCookieName,
      value: verificationToken,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: humanVerificationTtlSeconds,
    });

    return response;
  } catch (error) {
    console.error("人机验证处理错误:", error);
    return NextResponse.json(
      { message: "服务器处理请求时出错" },
      { status: 500 }
    );
  }
}
