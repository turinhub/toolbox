import type { Metadata } from "next";
import { HomePage } from "@/app/(zh)/page";
import { englishLocale } from "@/i18n/config";
import { buildHomeMetadata } from "@/lib/seo";

export const metadata: Metadata = buildHomeMetadata(englishLocale);

export default function EnglishHome() {
  return <HomePage locale={englishLocale} />;
}
