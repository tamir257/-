"use client";

import { Insight } from "@/lib/insights";

interface Props {
  insights: Insight[];
}

export default function InsightsPanel({ insights }: Props) {
  return (
    <div className="border-t border-gray-800 p-3">
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        תובנות אוטומטיות
      </h2>
      {insights.length === 0 && (
        <p className="text-xs text-gray-600">
          שום דבר מיוחד לא בולט כרגע בנתונים.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className={`rounded border-r-2 bg-gray-900 p-2 text-xs ${
              insight.tone === "warning"
                ? "border-amber-500"
                : "border-blue-500"
            }`}
          >
            <p className="mb-0.5 font-semibold text-gray-200">
              {insight.title}
            </p>
            <p className="leading-relaxed text-gray-400">{insight.body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-gray-600">
        הבהרה: תובנות אלו נגזרות מכללים סטטיסטיים ידועים, אינן ייעוץ השקעות
        ואינן המלצה לפעולה.
      </p>
    </div>
  );
}
