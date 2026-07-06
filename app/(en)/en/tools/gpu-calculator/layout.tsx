import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/gpu-calculator",
  englishLocale
);

export default function GpuCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo path="/tools/gpu-calculator" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
