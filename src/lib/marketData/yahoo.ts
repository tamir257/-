import { Candle, MarketDataProvider, Quote, Resolution } from "./types";

/**
 * Free, no-API-key market data provider backed by Yahoo Finance's
 * unofficial "chart" endpoint. Swapped in after Stooq turned out to
 * reject requests from cloud/serverless IP ranges (Vercel) even though
 * it worked fine from a home connection — see README "מקורות נתונים".
 * Data is delayed, same trade-off as before.
 */

const RANGE_BY_RESOLUTION: Record<Resolution, { interval: string; range: string }> = {
  daily: { interval: "1d", range: "2y" },
  weekly: { interval: "1wk", range: "5y" },
  monthly: { interval: "1mo", range: "10y" },
};

interface YahooChartResult {
  meta: {
    regularMarketPrice?: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    regularMarketVolume?: number;
    regularMarketTime?: number;
    previousClose?: number;
    chartPreviousClose?: number;
  };
  timestamp?: number[];
  indicators: {
    quote: {
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
      volume?: (number | null)[];
    }[];
  };
}

interface YahooChartResponse {
  chart: {
    result?: YahooChartResult[];
    error?: { code: string; description: string } | null;
  };
}

class YahooFinanceProvider implements MarketDataProvider {
  name = "Yahoo Finance (delayed, unofficial endpoint)";

  private async fetchChart(
    symbol: string,
    interval: string,
    range: string
  ): Promise<YahooChartResult> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?interval=${interval}&range=${range}`;

    const res = await fetch(url, {
      headers: {
        // Yahoo's unofficial endpoint sometimes rejects requests with no
        // browser-like User-Agent.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      throw new Error(`Yahoo Finance request failed: ${res.status}`);
    }

    const data = (await res.json()) as YahooChartResponse;
    if (data.chart.error) {
      throw new Error(
        `Yahoo Finance has no data for "${symbol}": ${data.chart.error.description}`
      );
    }
    const result = data.chart.result?.[0];
    if (!result) {
      throw new Error(`Yahoo Finance has no data for "${symbol}"`);
    }
    return result;
  }

  async getCandles(symbol: string, resolution: Resolution): Promise<Candle[]> {
    const { interval, range } = RANGE_BY_RESOLUTION[resolution];
    const result = await this.fetchChart(symbol, interval, range);
    const timestamps = result.timestamp ?? [];
    const quote = result.indicators.quote[0] ?? {};

    const candles: Candle[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const close = quote.close?.[i];
      // Yahoo pads non-trading gaps (holidays, pre-IPO) with nulls in every field.
      if (open == null || high == null || low == null || close == null) continue;
      candles.push({
        time: timestamps[i],
        open,
        high,
        low,
        close,
        volume: quote.volume?.[i] ?? 0,
      });
    }
    return candles;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const result = await this.fetchChart(symbol, "1d", "5d");
    const meta = result.meta;
    if (meta.regularMarketPrice == null) {
      throw new Error(`Yahoo Finance has no quote for "${symbol}"`);
    }
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
    return {
      symbol: symbol.toUpperCase(),
      time: meta.regularMarketTime ?? Math.floor(Date.now() / 1000),
      price: meta.regularMarketPrice,
      open: previousClose,
      high: meta.regularMarketDayHigh ?? meta.regularMarketPrice,
      low: meta.regularMarketDayLow ?? meta.regularMarketPrice,
      volume: meta.regularMarketVolume ?? 0,
      delayed: true,
    };
  }
}

export const yahooFinanceProvider = new YahooFinanceProvider();
