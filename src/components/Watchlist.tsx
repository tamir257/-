"use client";

import { useState } from "react";

interface Props {
  symbols: string[];
  activeSymbol: string;
  onSelect: (symbol: string) => void;
  onAdd: (symbol: string) => void;
  onRemove: (symbol: string) => void;
}

export default function Watchlist({
  symbols,
  activeSymbol,
  onSelect,
  onAdd,
  onRemove,
}: Props) {
  const [input, setInput] = useState("");

  function handleAdd() {
    if (!input.trim()) return;
    onAdd(input);
    setInput("");
  }

  return (
    <div className="border-l border-gray-800 p-3">
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        רשימת מעקב
      </h2>
      <div className="mb-3 flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="הוסף טיקר..."
          className="w-full rounded bg-gray-800 px-2 py-1 text-sm text-gray-100 outline-none placeholder:text-gray-500"
        />
        <button
          onClick={handleAdd}
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
              onClick={() => onRemove(symbol)}
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
