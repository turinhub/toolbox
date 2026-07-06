import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/s3-checker",
  englishLocale
);

export default function S3CheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo path="/tools/s3-checker" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
