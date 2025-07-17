// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { cn } from "@/lib/utils";

export function FavIcon({
  className,
  url,
  title,
}: {
  className?: string;
  url: string;
  title?: string;
}) {
  const getFaviconUrl = (url: string): string => {
    try {
      // Handle edge cases
      if (!url || typeof url !== 'string') {
        return "";
      }
      
      // Try to create URL object, handle malformed URLs gracefully
      let urlObject: URL;
      try {
        urlObject = new URL(url.trim());
      } catch {
        // If URL is invalid, return empty string to trigger onError
        return "";
      }
      
      // Only proceed with http/https protocols
      if (!['http:', 'https:'].includes(urlObject.protocol)) {
        return "";
      }
      
      return urlObject.origin + "/favicon.ico";
    } catch (error) {
      console.warn("Failed to generate favicon URL:", error);
      return "";
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    
    // Prevent infinite loops by checking if we've already tried the fallback
    if (target.src.includes("favicon-standard.png") || 
        target.src.includes("default-favicon")) {
      return;
    }
    
    // Use a more reliable fallback that includes multiple options
    target.src = 
      "https://www.google.com/s2/favicons?domain=https://example.com&sz=16";
    
    // If the Google favicon service also fails, use a data URI fallback
    target.onerror = () => {
      target.src = 
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%23e5e7eb'/%3E%3Ctext x='8' y='12' font-family='Arial' font-size='10' text-anchor='middle' fill='%236b7280'%3E?%3C/text%3E%3C/svg%3E";
    };
  };

  const faviconUrl = getFaviconUrl(url);
  
  // Don't render anything if we can't generate a valid URL
  if (!faviconUrl) {
    return (
      <div 
        className={cn("bg-accent h-4 w-4 rounded-full shadow-sm flex items-center justify-center", className)}
        title={title || "Website"}
      >
        <span className="text-[8px] text-muted-foreground">?</span>
      </div>
    );
  }

  return (
    <img
      className={cn("bg-accent h-4 w-4 rounded-full shadow-sm", className)}
      width={16}
      height={16}
      src={faviconUrl}
      alt={title || "Website favicon"}
      onError={handleImageError}
      loading="lazy"
      crossOrigin="anonymous"
    />
  );
}
