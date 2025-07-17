import { NextRequest, NextResponse } from "next/server";
import { isHumanVerified } from "./lib/turnstile";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 排除API接口
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 检查是否已通过人机验证（排除首页和工具页面）
  const verified = pathname === "/" || pathname.startsWith("/tools/") || isHumanVerified(request);

  if (!verified) {
    // 重定向到首页进行验证
    return NextResponse.redirect(new URL("/?verify=1", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 匹配所有页面路径，排除静态资源
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};