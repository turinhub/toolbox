import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/sidebar/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { SidebarOverlay } from "@/components/sidebar-overlay";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Turinhub Toolbox - 免费在线工具箱",
    template: "%s - Turinhub Toolbox",
  },
  description:
    "常用网页工具的汇集网站，基于 Vercel 和 Cloudflare 提供免费、无广告、无数据存储的常用在线工具箱。",
  keywords: [
    "在线工具",
    "免费工具",
    "开发工具",
    "文本处理",
    "格式化工具",
    "编码加密",
    "计算器",
    "API测试",
    "图像处理",
    "AI工具",
    "JSON格式化",
    "时间戳转换",
    "UUID生成",
    "Base64编码",
    "正则表达式测试",
  ],
  authors: [{ name: "Turinhub" }],
  creator: "Turinhub",
  publisher: "Turinhub",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://turinhub.com"
  ),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Turinhub Toolbox - 免费在线工具箱",
    description:
      "常用网页工具的汇集网站，基于 Vercel 和 Cloudflare 提供免费、无广告、无数据存储的常用在线工具箱。",
    url: "https://turinhub.com",
    siteName: "Turinhub Toolbox",
    images: [
      {
        url: "https://turinhub.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Turinhub Toolbox",
      },
    ],
    locale: "zh-CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Turinhub Toolbox - 免费在线工具箱",
    description:
      "常用网页工具的汇集网站，基于 Vercel 和 Cloudflare 提供免费、无广告、无数据存储的常用在线工具箱。",
    images: ["https://turinhub.com/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          defer
          src="https://umami.loongtales.com/script.js"
          data-website-id="4d3c06f9-0bef-45e6-86aa-4a7fe544e9f4"
        />
        <script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          async
          defer
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
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
                <main className="h-full w-full overflow-y-auto bg-background flex flex-col">
                  <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8 flex-1 md:pt-8 pt-16 min-h-0">
                    {children}
                  </div>
                </main>
              </SidebarInset>
            </div>
            <Toaster position="top-center" />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
