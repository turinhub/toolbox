// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { memo, useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Tooltip } from "./tooltip";

function Image({
  className = "",
  imageClassName = "",
  imageTransition = false,
  src = "",
  alt = "",
  fallback = null,
}: {
  className?: string;
  imageClassName?: string;
  imageTransition?: boolean;
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  useEffect(() => {
    // Reset state when src changes
    setIsError(false);
    setIsLoading(true);
    setRetryCount(0);
  }, [src]);

  const handleLoad = useCallback(() => {
    setIsError(false);
    setIsLoading(false);
    setRetryCount(0);
  }, []);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      // Prevent TypeError by safely accessing properties and handling edge cases
      const failedSrc = e?.currentTarget?.src || src || 'unknown';
      
      // Prevent network error from bubbling up and causing TypeError
      if (e && e.nativeEvent) {
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopPropagation();
      }
      
      console.warn(`Image failed to load: ${failedSrc}`, e);
      
      // Immediately mark as error to prevent infinite loading
      setIsError(true);
      setIsLoading(false);
      
      // Handle network errors gracefully - stop retrying after max attempts
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        
        // Skip retry for obvious network issues (CORS, invalid URLs, etc.)
        const isNetworkError = e?.currentTarget?.src?.includes('http');
        if (!isNetworkError) {
          setIsLoading(false);
          return;
        }
        
        // More conservative retry strategy
        const delay = Math.min(500 * Math.pow(2, retryCount), 5000);
        
        setTimeout(() => {
          try {
            // Add cache-busting parameter to avoid cached errors
            const retrySrc = src.includes('?') ? `${src}&retry=${retryCount}` : `${src}?retry=${retryCount}`;
            
            const img = new Image();
            img.onload = () => {
              setIsError(false);
              setIsLoading(false);
            };
            img.onerror = () => {
              // Final error state - stop retrying
              setIsLoading(false);
              console.warn(`Final retry failed for: ${failedSrc}`);
            };
            img.src = retrySrc;
          } catch (error) {
            console.warn('Error during image retry:', error);
            setIsLoading(false);
          }
        }, delay);
      } else {
        // Final error state
        setIsLoading(false);
        console.warn(`Max retries reached for image: ${src}`);
      }
    },
    [retryCount, maxRetries, src]);

  // Validate and sanitize URL
  const validateUrl = useCallback((url: string) => {
    try {
      if (!url || typeof url !== 'string') return false;
      const urlObj = new URL(url);
      // Allow http, https, and data URLs
      return ['http:', 'https:', 'data:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }, []);

  // Validate URL before attempting to load
  if (!src || !validateUrl(src)) {
    return <span className={cn("inline-block w-fit overflow-hidden", className)}>{fallback}</span>;
  }

  return (
    <span className={cn("relative inline-block w-fit overflow-hidden", className)}>
      <Tooltip title={alt || "图片"}>
        <img
          className={cn(
            "max-w-full h-auto object-contain",
            imageTransition && "transition-all duration-200 ease-out",
            imageClassName,
            isLoading && "opacity-0",
          )}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </Tooltip>
      {/* Always show loading state behind the image, never show error state */}
      <span className={cn(
        "absolute inset-0 bg-muted inline-flex h-40 w-40 animate-pulse items-center justify-center rounded-lg",
        !isLoading && "opacity-0"
      )}>
        <span className="text-sm text-gray-400">加载中...</span>
      </span>
    </span>
  );
}

export default memo(Image);
