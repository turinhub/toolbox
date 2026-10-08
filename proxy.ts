import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromPathname, localizePath } from "@/i18n/config";
import { isHumanVerified, isTurnstileProtectionEnabled } from "@/lib/turnstile";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = getLocaleFromPathname(pathname);

  if (pathname.startsWith("/api/") || pathname === "/workers/regex.worker.js") {
    return NextResponse.next();
  }

  const shouldVerify =
    isTurnstileProtectionEnabled() && pathname !== "/" && pathname !== "/en";

  if (shouldVerify && !isHumanVerified(request)) {
    const redirectUrl = new URL(localizePath("/", locale), request.url);
    redirectUrl.searchParams.set("verify", "1");
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|og-image.png|manifest(?:\\.[^/]+)?\\.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
