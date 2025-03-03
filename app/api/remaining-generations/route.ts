'use server'

import { NextRequest, NextResponse } from "next/server";
import { getGenerationCountFromRequest } from "@/lib/cookies";

const MAX_DAILY_GENERATIONS = 5;

export async function GET(request: NextRequest) {
  try {
    // 获取当前生成次数
    const currentCount = getGenerationCountFromRequest(request);
    
    // 计算剩余次数
    const remainingGenerations = Math.max(0, MAX_DAILY_GENERATIONS - currentCount);
    
    // 返回剩余次数
    return NextResponse.json({ 
      remainingGenerations,
      totalGenerations: MAX_DAILY_GENERATIONS,
      usedGenerations: currentCount
    });
  } catch (error) {
    console.error("获取剩余生成次数时出错:", error);
    return NextResponse.json(
      { message: "获取剩余生成次数失败" },
      { status: 500 }
    );
  }
} 