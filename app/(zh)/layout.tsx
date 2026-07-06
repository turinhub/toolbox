import type { Metadata, Viewport } from "next";
import { AppRootShell } from "@/components/app-root-shell";
import { defaultLocale } from "@/i18n/config";
import { buildHomeMetadata } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = buildHomeMetadata(defaultLocale);

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020817" },
  ],
};

export default function ZhRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppRootShell locale={defaultLocale}>{children}</AppRootShell>;
}
