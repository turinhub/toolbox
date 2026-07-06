import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/chinese-to-pinyin",
  englishLocale
);

export default function ChineseToPinyinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo path="/tools/chinese-to-pinyin" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
