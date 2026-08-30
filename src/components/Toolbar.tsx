"use client";

import { DrawingMode } from "./PriceChart";
import { Resolution } from "@/lib/marketData";

interface Props {
  drawingMode: DrawingMode;
  setDrawingMode: (mode: DrawingMode) => void;
  onClearDrawings: () => void;
  resolution: Resolution;
  setResolution: (r: Resolution) => void;
  showChat: boolean;
  onToggleChat: () => void;
  showFaq: boolean;
  onToggleFaq: () => void;
}

const RESOLUTIONS: { value: Resolution; label: string }[] = [
  { value: "daily", label: "יומי" },
  { value: "weekly", label: "שבועי" },
  { value: "monthly", label: "חודשי" },
];

export default function Toolbar({
  drawingMode,
  setDrawingMode,
  onClearDrawings,
  resolution,
  setResolution,
  showChat,
  onToggleChat,
  showFaq,
  onToggleFaq,
}: Props) {
  const btn = (mode: DrawingMode, label: string) => (
    <button
      onClick={() => setDrawingMode(drawingMode === mode ? "none" : mode)}
      className={`rounded px-3 py-1 text-sm ${
        drawingMode === mode
          ? "bg-blue-600 text-white"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-2 border-b border-gray-800 px-3 py-2">
      {btn("trendline", "קו מגמה")}
      {btn("horizontal", "קו אופקי")}
      <button
        onClick={onClearDrawings}
        className="rounded bg-gray-800 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700"
      >
        נקה ציורים
      </button>
      <div className="mx-2 h-4 w-px bg-gray-700" />
      {RESOLUTIONS.map((r) => (
        <button
          key={r.value}
          onClick={() => setResolution(r.value)}
          className={`rounded px-3 py-1 text-sm ${
            resolution === r.value
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          {r.label}
        </button>
      ))}
      <button
        onClick={onToggleFaq}
        className={`mr-auto rounded px-3 py-1 text-sm ${
          showFaq
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
        }`}
      >
        📚 שו&quot;ת חינמי
      </button>
      <button
        onClick={onToggleChat}
        className={`rounded px-3 py-1 text-sm ${
          showChat
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
        }`}
      >
        🤖 עוזר AI
      </button>
    </div>
  );
}
