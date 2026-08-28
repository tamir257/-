"use client";

import { useState } from "react";
import { Alert, AlertKind, ALERT_KIND_LABELS } from "@/lib/alerts/types";

interface Props {
  symbol: string;
  alerts: Alert[];
  onAdd: (symbol: string, kind: AlertKind, threshold: number) => void;
  onRemove: (id: string) => void;
  notificationPermission: NotificationPermission | "unsupported";
  onRequestNotificationPermission: () => void;
}

const KIND_OPTIONS: AlertKind[] = [
  "price_above",
  "price_below",
  "rsi_above",
  "rsi_below",
];

export default function AlertsPanel({
  symbol,
  alerts,
  onAdd,
  onRemove,
  notificationPermission,
  onRequestNotificationPermission,
}: Props) {
  const [kind, setKind] = useState<AlertKind>("price_above");
  const [threshold, setThreshold] = useState("");

  function submit() {
    const value = Number(threshold);
    if (!Number.isFinite(value)) return;
    onAdd(symbol, kind, value);
    setThreshold("");
  }

  return (
    <div className="border-t border-gray-800 p-3">
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        התראות — {symbol}
      </h2>

      {notificationPermission !== "granted" &&
        notificationPermission !== "unsupported" && (
          <button
            onClick={onRequestNotificationPermission}
            className="mb-2 w-full rounded bg-gray-800 px-2 py-1 text-xs text-gray-300 hover:bg-gray-700"
          >
            אפשר התראות מערכת בדפדפן
          </button>
        )}

      <div className="mb-2 flex flex-col gap-1">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as AlertKind)}
          className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-100"
        >
          {KIND_OPTIONS.map((k) => (
            <option key={k} value={k}>
              {ALERT_KIND_LABELS[k]}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          <input
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="ערך סף..."
            inputMode="decimal"
            className="w-full rounded bg-gray-800 px-2 py-1 text-sm text-gray-100 outline-none placeholder:text-gray-500"
          />
          <button
            onClick={submit}
            className="rounded bg-blue-600 px-2 text-sm text-white hover:bg-blue-500"
          >
            +
          </button>
        </div>
        {(kind === "rsi_above" || kind === "rsi_below") && (
          <p className="text-[11px] text-gray-500">
            התראת RSI פעילה רק כשהטיקר הזה פתוח בגרף.
          </p>
        )}
      </div>

      <ul className="flex flex-col gap-1">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="flex items-center justify-between rounded bg-gray-900 px-2 py-1 text-xs text-gray-300"
          >
            <span>
              {alert.symbol}: {ALERT_KIND_LABELS[alert.kind]} {alert.threshold}
              {alert.lastTriggeredAt && (
                <span className="text-gray-500"> · הופעלה</span>
              )}
            </span>
            <button
              onClick={() => onRemove(alert.id)}
              className="text-gray-500 hover:text-red-400"
              title="הסר"
            >
              ✕
            </button>
          </li>
        ))}
        {alerts.length === 0 && (
          <li className="text-xs text-gray-600">אין התראות עדיין</li>
        )}
      </ul>
    </div>
  );
}
