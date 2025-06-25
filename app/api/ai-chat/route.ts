import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.CLOUDFLARE_API_TOKEN,
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
});

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "消息格式不正确" }, { status: 400 });
    }

    // 调用OpenAI API
    const chatCompletion = await openai.chat.completions.create({
      messages,
      model: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
    });

    // console.log(chatCompletion);

    // 获取AI回复
    const assistantMessage = chatCompletion.choices[0].message;

    // console.log(assistantMessage);

    return NextResponse.json({
      content: assistantMessage.content?.replace("</think>", ""),
      role: assistantMessage.role,
    });
  } catch (error) {
    console.error("AI对话API错误:", error);
    return NextResponse.json({ error: "处理请求时出错" }, { status: 500 });
  }
}
