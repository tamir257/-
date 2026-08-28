"use client";

import { useState } from "react";
import { IbkrPosition, IbkrSummary } from "@/lib/ibkr/types";
import { IbkrConnectionState } from "@/hooks/useIbkrPortfolio";

interface Props {
  connection: IbkrConnectionState;
  positions: IbkrPosition[];
  summary: IbkrSummary | null;
  error: string | null;
}

const STATUS_LABEL: Record<IbkrConnectionState, { label: string; color: string }> = {
  disconnected: { label: "🔴 ה-Gateway לא רץ / לא נמצא", color: "text-red-400" },
  unauthenticated: { label: "🟡 ה-Gateway רץ, נדרשת התחברות", color: "text-amber-400" },
  connected: { label: "🟢 מחובר", color: "text-green-400" },
};

function fmt(n: number | undefined, digits = 2): string {
  return n === undefined || n === null ? "—" : n.toFixed(digits);
}

export default function PortfolioPanel({
  connection,
  positions,
  summary,
  error,
}: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const status = STATUS_LABEL[connection];

  return (
    <div className="border-t border-gray-800 p-3">
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        תיק IBKR (read-only)
      </h2>
      <p className={`mb-2 text-xs ${status.color}`}>{status.label}</p>

      {connection !== "connected" && (
        <p className="mb-2 text-[11px] leading-relaxed text-gray-500">
          הפעל את IBKR Client Portal Gateway אצלך, ואז התחבר ב-
          <a
            href="https://localhost:5000"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 underline"
          >
            https://localhost:5000
          </a>{" "}
          (ראה README). האפליקציה תזהה אוטומטית כשההתחברות תושלם.
        </p>
      )}

      {error && connection === "connected" && (
        <p className="mb-2 text-xs text-red-400">{error}</p>
      )}

      {connection === "connected" && (
        <>
          {summary?.netliquidation && (
            <p className="mb-2 text-xs text-gray-400">
              שווי תיק כולל: {fmt(summary.netliquidation.amount)}{" "}
              {summary.netliquidation.currency ?? ""}
            </p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-gray-500">
                  <th className="text-right font-normal">טיקר</th>
                  <th className="text-right font-normal">כמות</th>
                  <th className="text-right font-normal">עלות ממוצעת</th>
                  <th className="text-right font-normal">מחיר נוכחי</th>
                  <th className="text-right font-normal">P&L</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p) => (
                  <tr key={p.conid} className="text-gray-300">
                    <td>{p.ticker ?? p.contractDesc ?? p.conid}</td>
                    <td>{p.position}</td>
                    <td>{fmt(p.avgCost ?? p.avgPrice)}</td>
                    <td>{fmt(p.mktPrice)}</td>
                    <td
                      className={
                        (p.unrealizedPnl ?? 0) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {fmt(p.unrealizedPnl)}
                    </td>
                  </tr>
                ))}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-1 text-gray-600">
                      אין פוזיציות פתוחות בחשבון
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => setShowRaw((v) => !v)}
            className="mt-2 text-[10px] text-gray-600 underline hover:text-gray-400"
          >
            {showRaw ? "הסתר" : "הצג"} JSON גולמי (לאבחון)
          </button>
          {showRaw && (
            <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-950 p-2 text-[10px] text-gray-400">
              {JSON.stringify({ positions, summary }, null, 2)}
            </pre>
          )}
        </>
      )}
    </div>
  );
}
