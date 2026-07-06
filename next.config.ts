import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["ssh2"],
  allowedDevOrigins: ["127.0.0.1"],
};

export default withNextIntl(nextConfig);
