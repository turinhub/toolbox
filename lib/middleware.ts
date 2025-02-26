import { NextRequest, NextResponse } from 'next/server';
import { isHumanVerified } from './turnstile';

// 需要人机验证的路径
const PROTECTED_PATHS = [
  '/protected',
  '/api/protected',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 检查当前路径是否需要保护
  const needsProtection = PROTECTED_PATHS.some(path => 
    pathname.startsWith(path)
  );
  
  if (needsProtection) {
    // 检查是否已通过人机验证
    const verified = isHumanVerified(request);
    
    if (!verified) {
      // 如果是 API 请求，返回 401 错误
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { message: '需要人机验证' },
          { status: 401 }
        );
      }
      
      // 如果是页面请求，重定向到验证页面
      const url = new URL('/turnstile-demo', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // 匹配所有需要保护的路径
    '/protected/:path*',
    '/api/protected/:path*',
  ],
}; 