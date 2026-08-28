import { Candle, MarketDataProvider, Quote, Resolution } from "./types";

/**
 * Free, no-API-key market data provider backed by stooq.com.
 * Data is delayed (~15 min, sometimes more) — this is the documented
 * trade-off for the free tier (see README "מקורות נתונים").
 *
 * Symbol convention: a bare ticker like "AAPL" is assumed to be a US
 * listing and gets ".us" appended for Stooq. Pass an explicit Stooq
 * suffix yourself (e.g. "cdr.uk", "teva.il") for other markets.
 */
function toStooqSymbol(input: string): string {
  const s = input.trim().toLowerCase();
  return s.includes(".") ? s : `${s}.us`;
}

function resolutionToInterval(resolution: Resolution): string {
  switch (resolution) {
    case "weekly":
      return "w";
    case "monthly":
      return "m";
    case "daily":
    default:
      return "d";
  }
}

function parseCsvDate(dateStr: string): number {
  // Stooq dates are "YYYY-MM-DD"; treat as UTC midnight.
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 1000;
}

class StooqProvider implements MarketDataProvider {
  name = "stooq (delayed)";

  async getCandles(symbol: string, resolution: Resolution): Promise<Candle[]> {
    const stooqSymbol = toStooqSymbol(symbol);
    const interval = resolutionToInterval(resolution);
    const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(
      stooqSymbol
    )}&i=${interval}`;

    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      throw new Error(`Stooq candles request failed: ${res.status}`);
    }
    const text = await res.text();

    if (text.trim().startsWith("<") || text.includes("Exceeded")) {
      // Stooq returns an HTML/error page for unknown symbols or rate limits.
      throw new Error(`Stooq has no data for "${symbol}"`);
    }

    const lines = text.trim().split("\n").slice(1); // drop header row
    const candles: Candle[] = [];
    for (const line of lines) {
      const [date, open, high, low, close, volume] = line.split(",");
      if (!date || Number.isNaN(Number(open))) continue;
      candles.push({
        time: parseCsvDate(date),
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume) || 0,
      });
    }
    return candles;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const stooqSymbol = toStooqSymbol(symbol);
    // "l" (last) endpoint: delayed real-time-ish snapshot, no API key.
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(
      stooqSymbol
    )}&f=sd2t2ohlcv&h&e=csv`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Stooq quote request failed: ${res.status}`);
    }
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      throw new Error(`Stooq has no quote for "${symbol}"`);
    }
    const [, date, time, open, high, low, close, volume] =
      lines[1].split(",");

    if (!date || date === "N/D") {
      throw new Error(`Stooq has no quote for "${symbol}"`);
    }

    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm, ss] = (time ?? "00:00:00").split(":").map(Number);
    const timestamp = Date.UTC(y, m - 1, d, hh, mm, ss) / 1000;

    return {
      symbol: symbol.toUpperCase(),
      time: timestamp,
      price: Number(close),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      volume: Number(volume) || 0,
      delayed: true,
    };
  }
}

export const stooqProvider = new StooqProvider();
