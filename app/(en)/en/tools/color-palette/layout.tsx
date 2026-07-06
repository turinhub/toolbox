import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/color-palette",
  englishLocale
);

export default function ColorPaletteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo path="/tools/color-palette" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
