import type { Metadata } from "next";
import { ToolPageSeo } from "@/components/tool-page-seo";
import { englishLocale } from "@/i18n/config";
import { buildToolMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolMetadata(
  "/tools/jwt",
  englishLocale
);

export default function JwtLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToolPageSeo path="/tools/jwt" locale={englishLocale}>
      {children}
    </ToolPageSeo>
  );
}
