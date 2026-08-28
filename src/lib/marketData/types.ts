// Core data shapes for the market-data layer.
// Every concrete provider (Stooq today, a paid real-time feed later)
// must produce data in this shape so the rest of the app never
// needs to know which provider is behind it.

export interface Candle {
  /** Unix time in seconds (UTC), matches lightweight-charts' `Time`. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  symbol: string;
  time: number;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  /** True when the provider marks this as delayed data (vs. real-time). */
  delayed: boolean;
}

export type Resolution = "daily" | "weekly" | "monthly";

/**
 * Contract every market-data provider must implement.
 * Swapping the free delayed provider (Stooq) for a paid real-time one
 * later means writing a new class that implements this interface and
 * flipping one line in `index.ts` — nothing else in the app changes.
 */
export interface MarketDataProvider {
  name: string;
  getCandles(symbol: string, resolution: Resolution): Promise<Candle[]>;
  getQuote(symbol: string): Promise<Quote>;
}
