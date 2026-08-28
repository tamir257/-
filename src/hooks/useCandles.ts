"use client";

import { useEffect, useState } from "react";
import { Candle, Resolution } from "@/lib/marketData";

interface State {
  candles: Candle[];
  loading: boolean;
  error: string | null;
}

export function useCandles(symbol: string, resolution: Resolution) {
  const [state, setState] = useState<State>({
    candles: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    // Reset to a loading state for the new symbol/resolution before fetching.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({ ...s, loading: true, error: null }));

    fetch(
      `/api/candles?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}`
    )
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "שגיאה בטעינת נתונים");
        setState({ candles: data.candles, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ candles: [], loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, resolution]);

  return state;
}
