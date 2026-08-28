"use client";

import { useState } from "react";
import { IndicatorPreset } from "@/lib/presets/types";
import { OverlayConfig } from "./PriceChart";

interface Props {
  presets: IndicatorPreset[];
  currentOverlays: OverlayConfig;
  currentShowRSI: boolean;
  currentShowMACD: boolean;
  onSave: (preset: Omit<IndicatorPreset, "id">) => void;
  onRemove: (id: string) => void;
  onApply: (preset: IndicatorPreset) => void;
}

export default function PresetsPanel({
  presets,
  currentOverlays,
  currentShowRSI,
  currentShowMACD,
  onSave,
  onRemove,
  onApply,
}: Props) {
  const [name, setName] = useState("");

  function handleSave() {
    const clean = name.trim();
    if (!clean) return;
    onSave({
      name: clean,
      overlays: currentOverlays,
      showRSI: currentShowRSI,
      showMACD: currentShowMACD,
    });
    setName("");
  }

  return (
    <div className="border-t border-gray-800 p-3">
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        תבניות אינדיקטורים
      </h2>
      <div className="mb-2 flex gap-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="שם לתבנית הנוכחית..."
          className="w-full rounded bg-gray-800 px-2 py-1 text-sm text-gray-100 outline-none placeholder:text-gray-500"
        />
        <button
          onClick={handleSave}
          className="rounded bg-blue-600 px-2 text-sm text-white hover:bg-blue-500"
        >
          שמור
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {presets.map((preset) => (
          <li
            key={preset.id}
            className="flex items-center justify-between rounded bg-gray-900 px-2 py-1 text-xs text-gray-300"
          >
            <button
              onClick={() => onApply(preset)}
              className="flex-1 text-right hover:text-blue-400"
              title="טען תבנית"
            >
              {preset.name}
            </button>
            <button
              onClick={() => onRemove(preset.id)}
              className="px-1 text-gray-500 hover:text-red-400"
              title="מחק"
            >
              ✕
            </button>
          </li>
        ))}
        {presets.length === 0 && (
          <li className="text-xs text-gray-600">אין תבניות שמורות עדיין</li>
        )}
      </ul>
    </div>
  );
}
