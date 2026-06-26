"use client";

import { useRef } from "react";
import { useServerInsertedHTML } from "next/navigation";

interface StructuredDataProps {
  id: string;
  data: Record<string, unknown>;
}

export function StructuredData({ id, data }: StructuredDataProps) {
  const insertedRef = useRef(false);

  useServerInsertedHTML(() => {
    if (insertedRef.current) return null;
    insertedRef.current = true;

    return (
      <script
        id={id}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data),
        }}
      />
    );
  });

  return null;
}
