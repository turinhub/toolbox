"use client";

import React from "react";

interface StructuredDataProps {
  data: Record<string, unknown>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}

export function generateToolStructuredData({
  name,
  description,
  url,
  category,
}: {
  name: string;
  description: string;
  url: string;
  category: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url,
    applicationCategory: category,
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CNY",
    },
    author: {
      "@type": "Organization",
      name: "Turinhub",
      url: "https://turinhub.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Turinhub",
      url: "https://turinhub.com",
    },
  };
}

export function generateWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Turinhub Toolbox",
    description: "免费在线工具箱，提供各种实用的在线工具",
    url: "https://turinhub.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://turinhub.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}
