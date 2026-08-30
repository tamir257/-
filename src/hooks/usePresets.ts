"use client";

import { useEffect, useState } from "react";
import { IndicatorPreset } from "@/lib/presets/types";
import { BUILTIN_PRESETS } from "@/lib/presets/builtins";

const STORAGE_KEY = "indicator-presets";

export function usePresets() {
  const [customPresets, setCustomPresets] = useState<IndicatorPreset[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCustomPresets(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  function persist(next: IndicatorPreset[]) {
    setCustomPresets(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage may be unavailable (private mode) — non-fatal
    }
  }

  function savePreset(preset: Omit<IndicatorPreset, "id">) {
    persist([...customPresets, { ...preset, id: `${Date.now()}-${Math.random()}` }]);
  }

  function removePreset(id: string) {
    persist(customPresets.filter((p) => p.id !== id));
  }

  // Built-ins always come first, always available, never persisted/deletable.
  return { presets: [...BUILTIN_PRESETS, ...customPresets], savePreset, removePreset };
}
