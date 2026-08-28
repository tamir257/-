"use client";

import { useEffect, useState } from "react";
import { Quote } from "@/lib/marketData";

/**
 * Polls quotes for every symbol in the watchlist (not just the one being
 * charted) so price alerts keep working while you're looking at something
 * else. A longer interval than the single-symbol poll — this fans out one
 * request per symbol, so it should stay gentle on the free data source.
 */
export function useWatchlistQuotes(symbols: string[], intervalMs = 30_000) {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});

  useEffect(() => {
    if (symbols.length === 0) return;
    let cancelled = false;

    async function poll() {
      const results = await Promise.allSettled(
        symbols.map(async (symbol) => {
          const res = await fetch(
            `/api/quote?symbol=${encodeURIComponent(symbol)}`,
            { cache: "no-store" }
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "quote error");
          return data as Quote;
        })
      );
      if (cancelled) return;
      setQuotes((prev) => {
        const next = { ...prev };
        results.forEach((result, i) => {
          if (result.status === "fulfilled") {
            next[symbols[i]] = result.value;
          }
        });
        return next;
      });
    }

    poll();
    const id = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // Re-poll whenever the watchlist membership changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(symbols), intervalMs]);

  return quotes;
}
