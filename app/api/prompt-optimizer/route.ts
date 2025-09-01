import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiModel = process.env.OPENAI_MODEL;
    const openaiBaseUrl = process.env.OPENAI_BASE_URL;

    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // 创建优化提示词模板
    const optimizationPrompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `你是一位专业的AI提示词优化专家。请分析用户提供的提示词，并根据以下原则进行优化：

优化原则：
1. 明确性 - 确保指令清晰明确，避免歧义
2. 上下文 - 提供充分的背景信息和上下文
3. 结构化 - 使用清晰的结构和格式
4. 示例 - 提供具体的示例和期望输出
5. 角色定义 - 明确定义AI的角色和专业领域
6. 约束条件 - 添加必要的约束和限制
7. 格式规范 - 指定清晰的输出格式要求

请直接返回优化后的完整提示词，不需要额外的说明或建议。`,
      ],
      ["user", "{prompt}"],
    ]);

    const chatModel = new ChatOpenAI({
      modelName: openaiModel,
      apiKey: openaiApiKey,
      configuration: openaiBaseUrl ? { baseURL: openaiBaseUrl } : undefined,
      temperature: 0.7,
    });

    const outputParser = new StringOutputParser();

    const optimizationChain = optimizationPrompt
      .pipe(chatModel)
      .pipe(outputParser);

    const optimizedResult = await optimizationChain.invoke({
      prompt: prompt,
    });

    // 直接使用优化结果作为优化后的提示词
    const optimizedText = optimizedResult.trim();

    return NextResponse.json({
      optimizedPrompt: optimizedText,
      success: true,
    });
  } catch (error) {
    console.error("Error optimizing prompt:", error);
    return NextResponse.json(
      {
        error: "Failed to optimize prompt",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
