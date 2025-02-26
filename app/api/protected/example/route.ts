import { NextResponse } from "next/server";

export async function GET() {
  // 这个 API 路由受到中间件保护，只有通过人机验证的用户才能访问
  // 如果未通过验证，中间件会返回 401 错误，不会执行到这里
  
  return NextResponse.json({
    message: "您已成功访问受保护的 API",
    timestamp: new Date().toISOString(),
    data: {
      example: "这是一些敏感数据，只有通过人机验证的用户才能获取",
      verified: true
    }
  });
} 