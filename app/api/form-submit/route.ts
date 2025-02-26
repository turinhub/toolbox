import { NextRequest, NextResponse } from "next/server";
import { validateTurnstileToken } from "@/lib/turnstile";

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();

    // 验证必要的字段
    if (!email || !token) {
      return NextResponse.json(
        { message: "邮箱和验证令牌是必需的" },
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

    // 在这里处理表单数据，例如保存到数据库
    // 这里只是示例，实际应用中应该添加更多的处理逻辑

    return NextResponse.json(
      { message: "表单提交成功" },
      { status: 200 }
    );
  } catch (error) {
    console.error("表单提交处理错误:", error);
    return NextResponse.json(
      { message: "服务器处理请求时出错" },
      { status: 500 }
    );
  }
} 