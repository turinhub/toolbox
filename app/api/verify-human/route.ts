import { NextRequest, NextResponse } from "next/server";
import { validateTurnstileToken } from "@/lib/turnstile";

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

    // 创建响应对象
    const response = NextResponse.json(
      { message: "验证成功", verified: true },
      { status: 200 }
    );

    // 设置人机验证会话标记
    // 设置一个 cookie，有效期为 1 小时
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    
    // 使用 NextResponse 的 cookies API
    response.cookies.set({
      name: 'human_verified',
      value: 'true',
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      expires: expires
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