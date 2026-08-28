"use client";

import { useEffect, useRef, useState } from "react";
import { Quote } from "@/lib/marketData";
import { Alert, AlertKind, isPriceAlert } from "@/lib/alerts/types";

const STORAGE_KEY = "price-alerts";

export interface Toast {
  id: string;
  message: string;
  createdAt: number;
}

function loadAlerts(): Alert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function describeTrigger(alert: Alert, value: number): string {
  const metric = isPriceAlert(alert.kind) ? "המחיר" : "ה-RSI";
  const direction = alert.kind.endsWith("above") ? "עלה מעל" : "ירד מתחת ל-";
  return `${alert.symbol}: ${metric} ${direction} ${alert.threshold} (ערך נוכחי: ${value.toFixed(2)})`;
}

/**
 * Evaluates alert rules against live quotes (all watchlist symbols) and the
 * active chart's RSI (only symbol with full candle history loaded). Fires
 * on the rising edge only — an alert re-arms once its condition goes false.
 */
export function useAlerts(
  quotes: Record<string, Quote>,
  activeSymbol: string,
  activeRsiLast: number | null
) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission | "unsupported">("default");
  const alertsRef = useRef<Alert[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAlerts(loadAlerts());
    setNotificationPermission(
      typeof Notification === "undefined" ? "unsupported" : Notification.permission
    );
  }, []);

  useEffect(() => {
    alertsRef.current = alerts;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    } catch {
      // non-fatal
    }
  }, [alerts]);

  function pushToast(message: string) {
    const toast: Toast = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      createdAt: Date.now(),
    };
    setToasts((prev) => [...prev, toast]);
    if (notificationPermission === "granted") {
      new Notification("התראת מניה", { body: message });
    }
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function addAlert(symbol: string, kind: AlertKind, threshold: number) {
    setAlerts((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        symbol: symbol.toUpperCase(),
        kind,
        threshold,
        armed: true,
        createdAt: Date.now(),
        lastTriggeredAt: null,
      },
    ]);
  }

  function removeAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  async function requestNotificationPermission() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
  }

  // Evaluate on every fresh quote / RSI update.
  useEffect(() => {
    if (alertsRef.current.length === 0) return;

    setAlerts((prev) =>
      prev.map((alert) => {
        let currentValue: number | null = null;
        if (isPriceAlert(alert.kind)) {
          currentValue = quotes[alert.symbol]?.price ?? null;
        } else if (alert.symbol === activeSymbol) {
          currentValue = activeRsiLast;
        }
        if (currentValue === null) return alert;

        const isAbove = alert.kind === "price_above" || alert.kind === "rsi_above";
        const met = isAbove
          ? currentValue > alert.threshold
          : currentValue < alert.threshold;

        if (met && alert.armed) {
          pushToast(describeTrigger(alert, currentValue));
          return { ...alert, armed: false, lastTriggeredAt: Date.now() };
        }
        if (!met && !alert.armed) {
          return { ...alert, armed: true };
        }
        return alert;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes, activeSymbol, activeRsiLast]);

  return {
    alerts,
    addAlert,
    removeAlert,
    toasts,
    dismissToast,
    notificationPermission,
    requestNotificationPermission,
  };
}
