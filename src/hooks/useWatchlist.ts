"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "watchlist-symbols";
const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "NVDA"];

export function useWatchlist() {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSymbols(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  function persist(next: string[]) {
    setSymbols(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage may be unavailable (private mode) — non-fatal
    }
  }

  function addSymbol(raw: string): string | null {
    const clean = raw.trim().toUpperCase();
    if (!clean || symbols.includes(clean)) return null;
    persist([...symbols, clean]);
    return clean;
  }

  function removeSymbol(symbol: string) {
    persist(symbols.filter((s) => s !== symbol));
  }

  return { symbols, addSymbol, removeSymbol };
}
