"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineData,
  LogicalRange,
} from "lightweight-charts";

interface Line {
  data: LineData[];
  color: string;
}

interface Props {
  title: string;
  lines: Line[];
  height?: number;
  /** Shared logical range so this pane scrolls/zooms together with the main chart. */
  logicalRange: LogicalRange | null;
  onLogicalRangeChange: (range: LogicalRange | null) => void;
  /** Optional horizontal reference lines, e.g. RSI's 30/70 bands. */
  referenceLevels?: { value: number; color: string }[];
}

export default function IndicatorSubChart({
  title,
  lines,
  height = 120,
  logicalRange,
  onLogicalRangeChange,
  referenceLevels = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<"Line">[]>([]);
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: { background: { color: "transparent" }, textColor: "#9ca3af" },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      timeScale: { visible: false },
      rightPriceScale: { borderColor: "#374151" },
      crosshair: { mode: 0 },
    });
    chartRef.current = chart;

    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (syncingRef.current) return;
      onLogicalRangeChange(range);
    });

    for (const level of referenceLevels) {
      const s = chart.addLineSeries({
        color: level.color,
        lineWidth: 1,
        lineStyle: 2,
        crosshairMarkerVisible: false,
        lastValueVisible: false,
        priceLineVisible: false,
      });
      s.setData(
        lines[0]?.data.map((d) => ({ time: d.time, value: level.value })) ??
          []
      );
    }

    seriesRefs.current = lines.map((line) =>
      chart.addLineSeries({ color: line.color, lineWidth: 2 })
    );
    lines.forEach((line, i) => seriesRefs.current[i].setData(line.data));

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
    };
    // Re-created when the data itself changes; range sync handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, title, height]);

  useEffect(() => {
    if (!chartRef.current || !logicalRange) return;
    syncingRef.current = true;
    chartRef.current.timeScale().setVisibleLogicalRange(logicalRange);
    syncingRef.current = false;
  }, [logicalRange]);

  return (
    <div className="border-t border-gray-800">
      <div className="px-2 pt-1 text-xs text-gray-400">{title}</div>
      <div ref={containerRef} />
    </div>
  );
}
