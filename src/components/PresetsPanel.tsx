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
  const builtins = presets.filter((p) => p.builtin);
  const custom = presets.filter((p) => !p.builtin);

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
      <p className="mb-2 text-[11px] text-gray-500">
        לא בטוח מאיפה להתחיל? תלחץ על אחת מהתבניות המוכנות למטה.
      </p>

      <ul className="mb-3 flex flex-col gap-1">
        {builtins.map((preset) => (
          <li key={preset.id}>
            <button
              onClick={() => onApply(preset)}
              title={preset.description}
              className="w-full rounded bg-gray-900 px-2 py-1.5 text-right text-xs text-gray-200 hover:bg-gray-800 hover:text-blue-400"
            >
              <div className="font-medium">{preset.name}</div>
              {preset.description && (
                <div className="mt-0.5 text-[10px] leading-relaxed text-gray-500">
                  {preset.description}
                </div>
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="mb-2 flex gap-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="שמור את ההגדרה הנוכחית בשם..."
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
        {custom.map((preset) => (
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
        {custom.length === 0 && (
          <li className="text-xs text-gray-600">אין לך עדיין תבניות משלך</li>
        )}
      </ul>
    </div>
  );
}
