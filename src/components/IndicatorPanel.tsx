"use client";

import type { ReactNode } from "react";
import { OverlayConfig } from "./PriceChart";
import HelpTooltip from "./HelpTooltip";
import { GLOSSARY } from "@/lib/glossary";

interface Props {
  overlays: OverlayConfig;
  setOverlays: (next: OverlayConfig) => void;
  showRSI: boolean;
  setShowRSI: (v: boolean) => void;
  showMACD: boolean;
  setShowMACD: (v: boolean) => void;
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-blue-600"
      />
      {label}
    </label>
  );
}

export default function IndicatorPanel({
  overlays,
  setOverlays,
  showRSI,
  setShowRSI,
  showMACD,
  setShowMACD,
}: Props) {
  const toggleSma = (period: number, on: boolean) =>
    setOverlays({
      ...overlays,
      sma: on
        ? [...overlays.sma, period]
        : overlays.sma.filter((p) => p !== period),
    });

  const toggleEma = (period: number, on: boolean) =>
    setOverlays({
      ...overlays,
      ema: on
        ? [...overlays.ema, period]
        : overlays.ema.filter((p) => p !== period),
    });

  return (
    <div className="w-56 shrink-0 border-r border-gray-800 p-3">
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        אינדיקטורים
      </h2>
      <div className="mb-3 flex flex-col gap-1">
        <span className="text-xs text-gray-500">
          ממוצעים נעים <HelpTooltip text={GLOSSARY.sma} />
        </span>
        <Checkbox
          label="SMA 20"
          checked={overlays.sma.includes(20)}
          onChange={(v) => toggleSma(20, v)}
        />
        <Checkbox
          label="SMA 50"
          checked={overlays.sma.includes(50)}
          onChange={(v) => toggleSma(50, v)}
        />
        <span className="mt-1 flex items-center text-xs text-gray-500">
          <HelpTooltip text={GLOSSARY.ema} />
        </span>
        <Checkbox
          label="EMA 9"
          checked={overlays.ema.includes(9)}
          onChange={(v) => toggleEma(9, v)}
        />
        <Checkbox
          label="EMA 21"
          checked={overlays.ema.includes(21)}
          onChange={(v) => toggleEma(21, v)}
        />
      </div>
      <div className="mb-3 flex flex-col gap-1">
        <span className="text-xs text-gray-500">רצועות ונפח</span>
        <Checkbox
          label={
            <span className="flex items-center gap-1">
              Bollinger Bands (20, 2) <HelpTooltip text={GLOSSARY.bollinger} />
            </span>
          }
          checked={overlays.bollinger !== null}
          onChange={(v) =>
            setOverlays({
              ...overlays,
              bollinger: v ? { period: 20, mult: 2 } : null,
            })
          }
        />
        <Checkbox
          label={
            <span className="flex items-center gap-1">
              נפח (Volume) <HelpTooltip text={GLOSSARY.volume} />
            </span>
          }
          checked={overlays.volume}
          onChange={(v) => setOverlays({ ...overlays, volume: v })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">אוסילטורים (פאנל נפרד)</span>
        <Checkbox
          label={
            <span className="flex items-center gap-1">
              RSI (14) <HelpTooltip text={GLOSSARY.rsi} />
            </span>
          }
          checked={showRSI}
          onChange={setShowRSI}
        />
        <Checkbox
          label={
            <span className="flex items-center gap-1">
              MACD (12, 26, 9) <HelpTooltip text={GLOSSARY.macd} />
            </span>
          }
          checked={showMACD}
          onChange={setShowMACD}
        />
      </div>
    </div>
  );
}
