'use server'

import { NextRequest, NextResponse } from "next/server";
import { validateTurnstileToken } from "@/lib/turnstile";
import { 
  getGenerationCountFromRequest, 
  hasRequestReachedLimit
} from "@/lib/cookies";

export async function POST(request: NextRequest) {
  try {
    const { prompt, token, steps = 4 } = await request.json();

    // 验证必要的字段
    if (!prompt || !token) {
      return NextResponse.json(
        { message: "提示词和验证令牌是必需的" },
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

    // 检查生成次数限制
    if (hasRequestReachedLimit(request)) {
      return NextResponse.json(
        { message: "您今天的图像生成次数已达上限（5次/天），请明天再试" },
        { status: 429 }
      );
    }

    // 获取当前生成次数
    const currentCount = getGenerationCountFromRequest(request);
    const newCount = currentCount + 1;

    // 调用 Cloudflare AI API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          steps: Math.min(Math.max(parseInt(String(steps)), 4), 8), // 确保 steps 在 4-8 之间
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || "图像生成失败");
    }

    const data = await response.json();

    // 创建响应并设置cookie
    const apiResponse = NextResponse.json(
      { 
        message: "图像生成成功", 
        image: data.result.image,
        remainingGenerations: 5 - newCount 
      },
      { status: 200 }
    );

    // 获取今天的日期和明天凌晨的时间
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    // 设置图像生成计数 cookie
    apiResponse.cookies.set({
      name: 'image_generation_count',
      value: newCount.toString(),
      path: '/',
      expires: tomorrow,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false
    });

    // 设置图像生成日期 cookie
    apiResponse.cookies.set({
      name: 'image_generation_date',
      value: today,
      path: '/',
      expires: tomorrow,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false
    });

    // 设置剩余生成次数 cookie (用于客户端显示)
    apiResponse.cookies.set({
      name: 'remaining_generations',
      value: (5 - newCount).toString(),
      path: '/',
      expires: tomorrow,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false
    });

    // 设置验证令牌 Cookie
    apiResponse.cookies.set({
      name: 'cf-turnstile-valid',
      value: '1',
      path: '/',
      maxAge: 86400,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true
    });

    return apiResponse;
  } catch (error) {
    console.error("图像生成处理错误:", error);
    return NextResponse.json(
      { message: "服务器处理请求时出错" },
      { status: 500 }
    );
  }
}
