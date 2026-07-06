import type { Metadata } from "next";
import { ToolsPageContent } from "@/app/(zh)/tools/page";
import { englishLocale } from "@/i18n/config";
import { buildToolsPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildToolsPageMetadata(englishLocale);

export default function EnglishToolsPage() {
  return <ToolsPageContent locale={englishLocale} />;
}
