import { NextRequest, NextResponse } from "next/server";
import { isHumanVerified } from "./turnstile";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 排除API接口
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 检查是否已通过人机验证（排除首页）
  const verified = pathname === "/" || isHumanVerified(request);

  if (!verified) {
    // 重定向到首页进行验证
    return NextResponse.redirect(new URL("/?verify=1", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 匹配所有页面路径
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
