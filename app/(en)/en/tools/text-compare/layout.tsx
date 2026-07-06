import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/text-compare",
  englishLocale
);

export default function TextCompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo path="/tools/text-compare" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
