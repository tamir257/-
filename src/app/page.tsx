"use client";

import { useMemo, useRef, useState } from "react";
import { LogicalRange } from "lightweight-charts";
import PriceChart, { DrawingMode, OverlayConfig } from "@/components/PriceChart";
import IndicatorSubChart from "@/components/IndicatorSubChart";
import Watchlist from "@/components/Watchlist";
import IndicatorPanel from "@/components/IndicatorPanel";
import Toolbar from "@/components/Toolbar";
import { useCandles } from "@/hooks/useCandles";
import { useLiveQuote } from "@/hooks/useLiveQuote";
import { macd as calcMacd, rsi as calcRsi } from "@/lib/indicators";
import { Resolution } from "@/lib/marketData";

const DEFAULT_OVERLAYS: OverlayConfig = {
  sma: [20],
  ema: [],
  bollinger: null,
  volume: true,
};

export default function Home() {
  const [symbol, setSymbol] = useState("AAPL");
  const [resolution, setResolution] = useState<Resolution>("daily");
  const [overlays, setOverlays] = useState<OverlayConfig>(DEFAULT_OVERLAYS);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("none");
  const clearCounter = useRef(0);
  const [clearSignal, setClearSignal] = useState(0);
  const [logicalRange, setLogicalRange] = useState<LogicalRange | null>(null);

  const { candles: baseCandles, loading, error } = useCandles(
    symbol,
    resolution
  );
  const { quote, error: quoteError } = useLiveQuote(symbol);

  // Merge the polled "live" (delayed) quote into the most recent candle so
  // the chart's last bar visibly moves without a full historical re-fetch.
  const candles = useMemo(() => {
    if (!quote || resolution !== "daily" || baseCandles.length === 0) {
      return baseCandles;
    }
    const dayBucket = Math.floor(quote.time / 86400) * 86400;
    const last = baseCandles[baseCandles.length - 1];
    if (dayBucket === last.time) {
      const merged = {
        ...last,
        close: quote.price,
        high: Math.max(last.high, quote.high),
        low: Math.min(last.low, quote.low),
        volume: quote.volume || last.volume,
      };
      return [...baseCandles.slice(0, -1), merged];
    }
    if (dayBucket > last.time) {
      return [
        ...baseCandles,
        {
          time: dayBucket,
          open: quote.open,
          high: quote.high,
          low: quote.low,
          close: quote.price,
          volume: quote.volume,
        },
      ];
    }
    return baseCandles;
  }, [baseCandles, quote, resolution]);

  const rsiLines = useMemo(() => {
    const closes = candles.map((c) => c.close);
    const values = calcRsi(closes, 14);
    return [
      {
        color: "#a855f7",
        data: candles
          .map((c, i) => ({ time: c.time as never, value: values[i] }))
          .filter((d): d is { time: never; value: number } => d.value !== null),
      },
    ];
  }, [candles]);

  const macdLines = useMemo(() => {
    const closes = candles.map((c) => c.close);
    const { macd, signal } = calcMacd(closes);
    const build = (values: (number | null)[]) =>
      candles
        .map((c, i) => ({ time: c.time as never, value: values[i] }))
        .filter((d): d is { time: never; value: number } => d.value !== null);
    return [
      { color: "#3b82f6", data: build(macd) },
      { color: "#f59e0b", data: build(signal) },
    ];
  }, [candles]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold">{symbol}</h1>
          {quote && (
            <span className="text-sm text-gray-400">
              {quote.price.toFixed(2)} · מושהה כ-15 דק׳
            </span>
          )}
          {quoteError && (
            <span className="text-xs text-red-400">{quoteError}</span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          לשימוש אישי — לא מהווה ייעוץ השקעות
        </span>
      </header>

      <div className="flex flex-1">
        <IndicatorPanel
          overlays={overlays}
          setOverlays={setOverlays}
          showRSI={showRSI}
          setShowRSI={setShowRSI}
          showMACD={showMACD}
          setShowMACD={setShowMACD}
        />

        <main className="flex-1 overflow-hidden">
          <Toolbar
            drawingMode={drawingMode}
            setDrawingMode={setDrawingMode}
            onClearDrawings={() => {
              clearCounter.current += 1;
              setClearSignal(clearCounter.current);
            }}
            resolution={resolution}
            setResolution={setResolution}
          />

          {loading && (
            <p className="p-4 text-sm text-gray-400">טוען נתונים…</p>
          )}
          {error && (
            <p className="p-4 text-sm text-red-400">
              שגיאה בטעינת נתונים: {error}
            </p>
          )}

          {!loading && !error && (
            <>
              <PriceChart
                candles={candles}
                overlays={overlays}
                drawingMode={drawingMode}
                clearDrawingsSignal={clearSignal}
                logicalRange={logicalRange}
                onLogicalRangeChange={setLogicalRange}
              />
              {showRSI && (
                <IndicatorSubChart
                  title="RSI (14)"
                  lines={rsiLines}
                  logicalRange={logicalRange}
                  onLogicalRangeChange={setLogicalRange}
                  referenceLevels={[
                    { value: 70, color: "#6b7280" },
                    { value: 30, color: "#6b7280" },
                  ]}
                />
              )}
              {showMACD && (
                <IndicatorSubChart
                  title="MACD (12, 26, 9)"
                  lines={macdLines}
                  logicalRange={logicalRange}
                  onLogicalRangeChange={setLogicalRange}
                />
              )}
            </>
          )}
        </main>

        <Watchlist activeSymbol={symbol} onSelect={setSymbol} />
      </div>
    </div>
  );
}
