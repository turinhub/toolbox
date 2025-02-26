"use client";

import { Turnstile } from 'next-turnstile';

interface TurnstileWidgetProps {
  onVerify?: (token: string) => void;
}

export function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
  return (
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITEKEY || ''}
      onVerify={onVerify}
      className="mb-4"
    />
  );
} 