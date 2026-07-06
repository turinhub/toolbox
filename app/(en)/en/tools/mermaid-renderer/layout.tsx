import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/mermaid-renderer",
  englishLocale
);

export default function MermaidRendererLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo path="/tools/mermaid-renderer" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
