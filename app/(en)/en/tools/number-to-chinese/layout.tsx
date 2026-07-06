import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/number-to-chinese",
  englishLocale
);

export default function NumberToChineseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo path="/tools/number-to-chinese" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
