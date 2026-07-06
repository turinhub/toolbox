import type { AppLocale } from "@/i18n/config";
import enMessages from "@/messages/en.json";
import zhMessages from "@/messages/zh-CN.json";

export type AppMessages = typeof zhMessages;

const messages: Record<AppLocale, typeof zhMessages> = {
  "zh-CN": zhMessages,
  en: enMessages,
};

export function getMessages(locale: AppLocale) {
  return messages[locale];
}
