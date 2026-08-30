"use client";

import { useEffect, useState } from "react";
import { FaqEntry } from "@/lib/faq/types";
import { BUILTIN_FAQ } from "@/lib/faq/builtins";

const STORAGE_KEY = "faq-entries";

export function useFaq() {
  const [customEntries, setCustomEntries] = useState<FaqEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCustomEntries(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  function persist(next: FaqEntry[]) {
    setCustomEntries(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage may be unavailable (private mode) — non-fatal
    }
  }

  function addEntry(question: string, answer: string) {
    const q = question.trim();
    const a = answer.trim();
    if (!q || !a) return;
    persist([...customEntries, { id: `${Date.now()}-${Math.random()}`, question: q, answer: a }]);
  }

  function removeEntry(id: string) {
    persist(customEntries.filter((e) => e.id !== id));
  }

  return {
    entries: [...BUILTIN_FAQ, ...customEntries],
    addEntry,
    removeEntry,
  };
}
