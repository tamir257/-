"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LogicalRange,
  IPriceLine,
} from "lightweight-charts";
import { Candle } from "@/lib/marketData";
import { bollingerBands, ema, sma } from "@/lib/indicators";
import {
  BOLLINGER_COLOR,
  EMA_COLORS,
  SMA_COLORS,
  VOLUME_DOWN,
  VOLUME_UP,
} from "@/lib/chartColors";

export type DrawingMode = "none" | "trendline" | "horizontal";

export interface OverlayConfig {
  sma: number[];
  ema: number[];
  bollinger: { period: number; mult: number } | null;
  volume: boolean;
}

interface Props {
  candles: Candle[];
  overlays: OverlayConfig;
  drawingMode: DrawingMode;
  clearDrawingsSignal: number;
  logicalRange: LogicalRange | null;
  onLogicalRangeChange: (range: LogicalRange | null) => void;
}

export default function PriceChart({
  candles,
  overlays,
  drawingMode,
  clearDrawingsSignal,
  logicalRange,
  onLogicalRangeChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const overlaySeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());
  const syncingRef = useRef(false);

  // Drawing state, kept alive for the lifetime of the chart instance.
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const trendlineSeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const pendingPointRef = useRef<{ time: number; price: number } | null>(
    null
  );

  // --- Create the chart once ---
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height: 420,
      layout: { background: { color: "transparent" }, textColor: "#d1d5db" },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      rightPriceScale: { borderColor: "#374151" },
      timeScale: { borderColor: "#374151" },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (syncingRef.current) return;
      onLogicalRangeChange(range);
    });

    const resize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Push candle + volume data whenever it changes ---
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;
    candleSeriesRef.current.setData(
      candles.map((c) => ({
        time: c.time as never,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    volumeSeriesRef.current.setData(
      overlays.volume
        ? candles.map((c) => ({
            time: c.time as never,
            value: c.volume,
            color: c.close >= c.open ? VOLUME_UP : VOLUME_DOWN,
          }))
        : []
    );
  }, [candles, overlays.volume]);

  // --- Reconcile overlay indicator series with the desired config ---
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const closes = candles.map((c) => c.close);
    const times = candles.map((c) => c.time);

    const desired = new Map<string, { color: string; values: (number | null)[] }>();
    overlays.sma.forEach((period, i) =>
      desired.set(`sma-${period}`, {
        color: SMA_COLORS[i % SMA_COLORS.length],
        values: sma(closes, period),
      })
    );
    overlays.ema.forEach((period, i) =>
      desired.set(`ema-${period}`, {
        color: EMA_COLORS[i % EMA_COLORS.length],
        values: ema(closes, period),
      })
    );
    if (overlays.bollinger) {
      const { upper, middle, lower } = bollingerBands(
        closes,
        overlays.bollinger.period,
        overlays.bollinger.mult
      );
      desired.set("bb-upper", { color: BOLLINGER_COLOR, values: upper });
      desired.set("bb-middle", { color: BOLLINGER_COLOR, values: middle });
      desired.set("bb-lower", { color: BOLLINGER_COLOR, values: lower });
    }

    const existing = overlaySeriesRef.current;
    for (const [key, series] of existing) {
      if (!desired.has(key)) {
        chart.removeSeries(series);
        existing.delete(key);
      }
    }
    for (const [key, { color, values }] of desired) {
      let series = existing.get(key);
      if (!series) {
        series = chart.addLineSeries({
          color,
          lineWidth: key.startsWith("bb-") ? 1 : 2,
          lineStyle: key === "bb-middle" ? 2 : 0,
          lastValueVisible: false,
          priceLineVisible: false,
        });
        existing.set(key, series);
      }
      series.setData(
        times
          .map((time, i) => ({ time: time as never, value: values[i] }))
          .filter((d): d is { time: never; value: number } => d.value !== null)
      );
    }
  }, [candles, overlays]);

  // --- Keep this chart's visible range synced with sibling panes ---
  useEffect(() => {
    if (!chartRef.current || !logicalRange) return;
    syncingRef.current = true;
    chartRef.current.timeScale().setVisibleLogicalRange(logicalRange);
    syncingRef.current = false;
  }, [logicalRange]);

  // --- Drawing tools: horizontal ruler + trendline ---
  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    pendingPointRef.current = null;

    const handler = (param: Parameters<Parameters<IChartApi["subscribeClick"]>[0]>[0]) => {
      if (drawingMode === "none" || !param.point || param.time == null) return;
      const price = candleSeries.coordinateToPrice(param.point.y);
      if (price == null) return;

      if (drawingMode === "horizontal") {
        const line = candleSeries.createPriceLine({
          price,
          color: "#eab308",
          lineWidth: 2,
          lineStyle: 0,
          axisLabelVisible: true,
          title: price.toFixed(2),
        });
        priceLinesRef.current.push(line);
        return;
      }

      if (drawingMode === "trendline") {
        const time = param.time as number;
        if (!pendingPointRef.current) {
          pendingPointRef.current = { time, price };
        } else {
          const a = pendingPointRef.current;
          const line = chart.addLineSeries({
            color: "#eab308",
            lineWidth: 2,
            lastValueVisible: false,
            priceLineVisible: false,
          });
          line.setData([
            { time: a.time as never, value: a.price },
            { time: time as never, value: price },
          ]);
          trendlineSeriesRef.current.push(line);
          pendingPointRef.current = null;
        }
      }
    };

    chart.subscribeClick(handler);
    return () => chart.unsubscribeClick(handler);
  }, [drawingMode]);

  // --- Clear all drawings when asked to ---
  useEffect(() => {
    if (clearDrawingsSignal === 0) return;
    const candleSeries = candleSeriesRef.current;
    const chart = chartRef.current;
    if (!candleSeries || !chart) return;
    priceLinesRef.current.forEach((l) => candleSeries.removePriceLine(l));
    priceLinesRef.current = [];
    trendlineSeriesRef.current.forEach((s) => chart.removeSeries(s));
    trendlineSeriesRef.current = [];
  }, [clearDrawingsSignal]);

  return <div ref={containerRef} className="w-full" />;
}
