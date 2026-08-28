export type AlertKind = "price_above" | "price_below" | "rsi_above" | "rsi_below";

export interface Alert {
  id: string;
  symbol: string;
  kind: AlertKind;
  threshold: number;
  /** True when the condition is not currently met — required before it can fire again (edge-triggered, not level-triggered). */
  armed: boolean;
  createdAt: number;
  lastTriggeredAt: number | null;
}

export const ALERT_KIND_LABELS: Record<AlertKind, string> = {
  price_above: "מחיר עולה מעל",
  price_below: "מחיר יורד מתחת ל-",
  rsi_above: "RSI עולה מעל",
  rsi_below: "RSI יורד מתחת ל-",
};

/** RSI alerts only evaluate while that symbol's chart is open (see README). */
export function isPriceAlert(kind: AlertKind) {
  return kind === "price_above" || kind === "price_below";
}
