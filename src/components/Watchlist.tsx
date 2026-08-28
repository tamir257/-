"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "watchlist-symbols";
const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "NVDA"];

interface Props {
  activeSymbol: string;
  onSelect: (symbol: string) => void;
}

export default function Watchlist({ activeSymbol, onSelect }: Props) {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [input, setInput] = useState("");

  useEffect(() => {
    // One-time hydration from localStorage (an external store) after mount —
    // intentionally synchronous, not derived render state.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSymbols(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  function persist(next: string[]) {
    setSymbols(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage may be unavailable (private mode) — non-fatal
    }
  }

  function addSymbol() {
    const clean = input.trim().toUpperCase();
    if (!clean || symbols.includes(clean)) return;
    persist([...symbols, clean]);
    onSelect(clean);
    setInput("");
  }

  function removeSymbol(symbol: string) {
    persist(symbols.filter((s) => s !== symbol));
  }

  return (
    <div className="w-56 shrink-0 border-l border-gray-800 p-3">
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        רשימת מעקב
      </h2>
      <div className="mb-3 flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSymbol()}
          placeholder="הוסף טיקר..."
          className="w-full rounded bg-gray-800 px-2 py-1 text-sm text-gray-100 outline-none placeholder:text-gray-500"
        />
        <button
          onClick={addSymbol}
          className="rounded bg-blue-600 px-2 text-sm text-white hover:bg-blue-500"
        >
          +
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {symbols.map((symbol) => (
          <li key={symbol} className="flex items-center">
            <button
              onClick={() => onSelect(symbol)}
              className={`flex-1 rounded px-2 py-1 text-right text-sm ${
                symbol === activeSymbol
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {symbol}
            </button>
            <button
              onClick={() => removeSymbol(symbol)}
              className="px-2 text-xs text-gray-500 hover:text-red-400"
              title="הסר"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
