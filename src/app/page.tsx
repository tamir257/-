"use client";

import { useMemo, useRef, useState } from "react";
import { LogicalRange } from "lightweight-charts";
import PriceChart, { DrawingMode, OverlayConfig } from "@/components/PriceChart";
import IndicatorSubChart from "@/components/IndicatorSubChart";
import Watchlist from "@/components/Watchlist";
import IndicatorPanel from "@/components/IndicatorPanel";
import Toolbar from "@/components/Toolbar";
import InsightsPanel from "@/components/InsightsPanel";
import AlertsPanel from "@/components/AlertsPanel";
import AlertToast from "@/components/AlertToast";
import ChatPanel from "@/components/ChatPanel";
import FaqPanel from "@/components/FaqPanel";
import PortfolioPanel from "@/components/PortfolioPanel";
import PresetsPanel from "@/components/PresetsPanel";
import OnboardingModal from "@/components/OnboardingModal";
import { useCandles } from "@/hooks/useCandles";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useLiveQuote } from "@/hooks/useLiveQuote";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useWatchlistQuotes } from "@/hooks/useWatchlistQuotes";
import { useAlerts } from "@/hooks/useAlerts";
import { useIbkrPortfolio } from "@/hooks/useIbkrPortfolio";
import { usePresets } from "@/hooks/usePresets";
import { useFaq } from "@/hooks/useFaq";
import { IndicatorPreset } from "@/lib/presets/types";
import { macd as calcMacd, rsi as calcRsi } from "@/lib/indicators";
import { generateInsights } from "@/lib/insights";
import { buildChatContext } from "@/lib/claude/buildContext";
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
  const [showChat, setShowChat] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  const { symbols, addSymbol, removeSymbol } = useWatchlist();
  const { candles: baseCandles, loading, error } = useCandles(
    symbol,
    resolution
  );
  const { quote, error: quoteError } = useLiveQuote(symbol);
  const watchlistQuotes = useWatchlistQuotes(symbols);

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

  const rsiValues = useMemo(
    () => calcRsi(candles.map((c) => c.close), 14),
    [candles]
  );
  const lastRsi = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : null;

  const rsiLines = useMemo(
    () => [
      {
        color: "#a855f7",
        data: candles
          .map((c, i) => ({ time: c.time as never, value: rsiValues[i] }))
          .filter((d): d is { time: never; value: number } => d.value !== null),
      },
    ],
    [candles, rsiValues]
  );

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

  const insights = useMemo(() => generateInsights(candles), [candles]);

  const {
    alerts,
    addAlert,
    removeAlert,
    toasts,
    dismissToast,
    notificationPermission,
    requestNotificationPermission,
  } = useAlerts(watchlistQuotes, symbol, lastRsi);

  const {
    connection: ibkrConnection,
    positions: ibkrPositions,
    summary: ibkrSummary,
    error: ibkrError,
  } = useIbkrPortfolio();
  const activePosition =
    ibkrPositions.find((p) => (p.ticker ?? "").toUpperCase() === symbol.toUpperCase()) ??
    null;

  const { presets, savePreset, removePreset } = usePresets();
  const { entries: faqEntries, addEntry: addFaqEntry, removeEntry: removeFaqEntry } = useFaq();
  const { open: onboardingOpen, close: closeOnboarding, reopen: reopenOnboarding } = useOnboarding();
  function applyPreset(preset: IndicatorPreset) {
    setOverlays(preset.overlays);
    setShowRSI(preset.showRSI);
    setShowMACD(preset.showMACD);
  }

  // Read fresh at send-time (not memoized) — the chat only needs the
  // current values when the user actually sends a message.
  const buildContext = () =>
    buildChatContext({
      symbol,
      quote,
      lastRsi,
      overlays,
      insights,
      position: activePosition,
    });

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
        <div className="flex items-center gap-3">
          <button
            onClick={reopenOnboarding}
            className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700"
          >
            ❓ מדריך
          </button>
          <span className="text-xs text-gray-500">
            לשימוש אישי — לא מהווה ייעוץ השקעות
          </span>
        </div>
      </header>

      <OnboardingModal open={onboardingOpen} onClose={closeOnboarding} />

      <div className="flex flex-1">
        <aside className="flex w-56 shrink-0 flex-col overflow-y-auto">
          <IndicatorPanel
            overlays={overlays}
            setOverlays={setOverlays}
            showRSI={showRSI}
            setShowRSI={setShowRSI}
            showMACD={showMACD}
            setShowMACD={setShowMACD}
          />
          <PresetsPanel
            presets={presets}
            currentOverlays={overlays}
            currentShowRSI={showRSI}
            currentShowMACD={showMACD}
            onSave={savePreset}
            onRemove={removePreset}
            onApply={applyPreset}
          />
        </aside>

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
            showChat={showChat}
            onToggleChat={() => setShowChat((v) => !v)}
            showFaq={showFaq}
            onToggleFaq={() => setShowFaq((v) => !v)}
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
                positionEntryPrice={
                  activePosition
                    ? (activePosition.avgCost ?? activePosition.avgPrice ?? null)
                    : null
                }
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

          {showFaq && (
            <FaqPanel
              entries={faqEntries}
              onAddEntry={addFaqEntry}
              onRemoveEntry={removeFaqEntry}
            />
          )}
          {showChat && <ChatPanel buildContext={buildContext} />}
        </main>

        <aside className="flex w-56 shrink-0 flex-col overflow-y-auto">
          <Watchlist
            symbols={symbols}
            activeSymbol={symbol}
            onSelect={setSymbol}
            onAdd={addSymbol}
            onRemove={removeSymbol}
          />
          <InsightsPanel insights={insights} />
          <AlertsPanel
            symbol={symbol}
            alerts={alerts.filter((a) => a.symbol === symbol)}
            onAdd={addAlert}
            onRemove={removeAlert}
            notificationPermission={notificationPermission}
            onRequestNotificationPermission={requestNotificationPermission}
          />
          <PortfolioPanel
            connection={ibkrConnection}
            positions={ibkrPositions}
            summary={ibkrSummary}
            error={ibkrError}
          />
        </aside>
      </div>

      <AlertToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
