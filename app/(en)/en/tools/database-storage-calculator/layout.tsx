import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/database-storage-calculator",
  englishLocale
);

export default function DatabaseStorageCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo
      path="/tools/database-storage-calculator"
      locale={englishLocale}
    >
      {children}
    </ToolPageSeo>
  );
}
