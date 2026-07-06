import { getRequestConfig } from "next-intl/server";
import { normalizeLocale } from "@/i18n/config";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = normalizeLocale(await requestLocale);

  return {
    locale,
    timeZone: "Asia/Shanghai",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
