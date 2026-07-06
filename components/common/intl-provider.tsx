"use client";

import { NextIntlClientProvider } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { getLocaleFromPathname, type AppLocale } from "@/i18n/config";
import enMessages from "@/messages/en.json";
import zhMessages from "@/messages/zh-CN.json";

const messages: Record<AppLocale, typeof zhMessages> = {
  "zh-CN": zhMessages,
  en: enMessages,
};

export function IntlProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: AppLocale;
}) {
  const pathname = usePathname();
  const locale = pathname ? getLocaleFromPathname(pathname) : initialLocale;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale]}
      timeZone="Asia/Shanghai"
    >
      {children}
    </NextIntlClientProvider>
  );
}
