// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useEffect } from 'react';

export function NetworkErrorHandler() {
  useEffect(() => {
    // Global error handler to suppress network-related TypeErrors
    const handleGlobalError = (event: ErrorEvent) => {
      const error = event.error;
      const message = error?.message || '';
      
      // Suppress network-related errors
      if (
        message.includes('NetworkError') ||
        message.includes('TypeError: network') ||
        message.includes('TypeError: Network') ||
        message.includes('Failed to fetch') ||
        message.includes('net::ERR') ||
        message.includes('Image loading') ||
        message.includes('Image failed')
      ) {
        console.warn('Network error suppressed:', message);
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    // Global unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason?.message || reason || '';
      
      // Suppress network-related promise rejections
      if (
        message.includes('NetworkError') ||
        message.includes('TypeError: network') ||
        message.includes('TypeError: Network') ||
        message.includes('Failed to fetch') ||
        message.includes('net::ERR') ||
        message.includes('Image loading')
      ) {
        console.warn('Network rejection suppressed:', message);
        event.preventDefault();
        return false;
      }
    };

    // Add global error handlers
    window.addEventListener('error', handleGlobalError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

    return () => {
      window.removeEventListener('error', handleGlobalError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
    };
  }, []);

  return null;
}