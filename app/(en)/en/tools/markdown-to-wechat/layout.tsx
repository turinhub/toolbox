import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/markdown-to-wechat",
  englishLocale
);

export default function MarkdownToWechatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolPageSeo path="/tools/markdown-to-wechat" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
