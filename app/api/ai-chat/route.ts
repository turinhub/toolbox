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

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 调用OpenAI API并启用流式输出
          const chatCompletion = await openai.chat.completions.create({
            messages,
            model: "@cf/qwen/qwen1.5-14b-chat-awq",
            stream: true,
          });

          // 处理流式数据
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              // 发送SSE格式的数据
              const sseData = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(new TextEncoder().encode(sseData));
            }
          }

          // 发送结束标记
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        } catch (error) {
          console.error("流式输出错误:", error);
          const errorData = `data: ${JSON.stringify({ error: "处理请求时出错" })}\n\n`;
          controller.enqueue(new TextEncoder().encode(errorData));
        } finally {
          controller.close();
        }
      },
    });

    // 返回流式响应
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI对话API错误:", error);
    return NextResponse.json({ error: "处理请求时出错" }, { status: 500 });
  }
}
