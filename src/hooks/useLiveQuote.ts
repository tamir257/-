"use client";

import { useEffect, useState } from "react";
import { Quote } from "@/lib/marketData";

/**
 * Polls the delayed quote endpoint periodically so open charts feel "live"
 * without needing a real-time (paid) feed. 15s matches the ~15min delay of
 * the underlying data — polling faster wouldn't reveal fresher information.
 */
export function useLiveQuote(symbol: string, intervalMs = 15_000) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(
          `/api/quote?symbol=${encodeURIComponent(symbol)}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "שגיאה בשליפת ציטוט");
        setQuote(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "שגיאה");
      }
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol, intervalMs]);

  return { quote, error };
}
