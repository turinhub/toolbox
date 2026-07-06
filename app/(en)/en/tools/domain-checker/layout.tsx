import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/domain-checker",
  englishLocale
);

export default function DomainCheckerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo path="/tools/domain-checker" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
