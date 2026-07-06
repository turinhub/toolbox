import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/json-visual-editor",
  englishLocale
);

export default function JsonVisualEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo path="/tools/json-visual-editor" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
