import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/prompt-optimizer",
  englishLocale
);

export default function PromptOptimizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo path="/tools/prompt-optimizer" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
