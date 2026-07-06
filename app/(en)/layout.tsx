import type { Metadata, Viewport } from "next";
import { AppRootShell } from "@/components/app-root-shell";
import { englishLocale } from "@/i18n/config";
import { buildHomeMetadata } from "@/lib/seo";
import "../globals.css";

export const metadata: Metadata = buildHomeMetadata(englishLocale);

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020817" },
  ],
};

export default function EnRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppRootShell locale={englishLocale}>{children}</AppRootShell>;
}
