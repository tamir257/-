"use client";

import { useState } from "react";

interface Props {
  text: string;
}

/** Small "?" icon that reveals a plain-language explanation on click. */
export default function HelpTooltip({ text }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        className="mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-700 text-[10px] text-gray-300 hover:bg-gray-600"
        aria-label="הסבר"
      >
        ?
      </button>
      {open && (
        <span className="absolute right-0 top-5 z-20 w-56 rounded bg-gray-800 p-2 text-[11px] leading-relaxed text-gray-200 shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}
