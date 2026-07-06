import Script from "next/script";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/sidebar/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { SidebarOverlay } from "@/components/sidebar-overlay";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { RecentToolsTracker } from "@/components/common/recent-tools-tracker";
import { IntlProvider } from "@/components/common/intl-provider";
import { SkipLink } from "@/components/common/skip-link";
import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/lib/messages";

export function AppRootShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: AppLocale;
}) {
  const messages = getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <Script
          id="umami-analytics"
          src="https://umami.loongtales.com/script.js"
          data-website-id="4d3c06f9-0bef-45e6-86aa-4a7fe544e9f4"
          strategy="afterInteractive"
        />
        <Script
          id="cloudflare-turnstile"
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
        <IntlProvider locale={locale} messages={messages}>
          <SkipLink />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <MobileNav />
              <SidebarOverlay />
              <div className="flex h-screen w-full">
                <Sidebar />
                <SidebarInset className="flex-1 overflow-hidden">
                  <main
                    id="main-content"
                    className="h-full w-full overflow-y-auto bg-background flex flex-col"
                  >
                    <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8 flex-1 md:pt-8 pt-16 min-h-0">
                      <RecentToolsTracker />
                      {children}
                    </div>
                  </main>
                </SidebarInset>
              </div>
              <Toaster position="top-center" />
            </SidebarProvider>
          </ThemeProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
