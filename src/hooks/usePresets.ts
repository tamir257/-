"use client";

import { useEffect, useState } from "react";
import { IndicatorPreset } from "@/lib/presets/types";

const STORAGE_KEY = "indicator-presets";

export function usePresets() {
  const [presets, setPresets] = useState<IndicatorPreset[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setPresets(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  function persist(next: IndicatorPreset[]) {
    setPresets(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage may be unavailable (private mode) — non-fatal
    }
  }

  function savePreset(preset: Omit<IndicatorPreset, "id">) {
    persist([...presets, { ...preset, id: `${Date.now()}-${Math.random()}` }]);
  }

  function removePreset(id: string) {
    persist(presets.filter((p) => p.id !== id));
  }

  return { presets, savePreset, removePreset };
}
