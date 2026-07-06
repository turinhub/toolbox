import { NextRequest, NextResponse } from "next/server";
import { getLocaleFromPathname, localizePath } from "@/i18n/config";
import { isHumanVerified } from "@/lib/turnstile";

function isTurnstileProtectionEnabled() {
  return Boolean(
    process.env.TOOLBOX_PROXY_TURNSTILE === "true" &&
      process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY &&
      process.env.CLOUDFLARE_TURNSTILE_SECRETKEY
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = getLocaleFromPathname(pathname);

  if (pathname.startsWith("/api/")) {
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
