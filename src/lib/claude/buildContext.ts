import { Quote } from "@/lib/marketData";
import { Insight } from "@/lib/insights";
import { OverlayConfig } from "@/components/PriceChart";
import { IbkrPosition } from "@/lib/ibkr/types";

/**
 * Compact, plain-text summary of what's currently on screen — sent as part
 * of the latest user turn (see api/chat/route.ts) so Claude answers about
 * the actual chart instead of guessing. Deliberately doesn't include raw
 * candle history: the computed values below are enough context and keep
 * the request small.
 */
export function buildChatContext(params: {
  symbol: string;
  quote: Quote | null;
  lastRsi: number | null;
  overlays: OverlayConfig;
  insights: Insight[];
  position?: IbkrPosition | null;
}): string {
  const { symbol, quote, lastRsi, overlays, insights, position } = params;
  const lines: string[] = [];

  lines.push(`טיקר פתוח כרגע בגרף: ${symbol}`);
  if (quote) {
    lines.push(
      `מחיר אחרון (מושהה כ-15 דק'): ${quote.price.toFixed(2)} | פתיחה: ${quote.open.toFixed(2)} | גבוה: ${quote.high.toFixed(2)} | נמוך: ${quote.low.toFixed(2)}`
    );
  } else {
    lines.push("אין עדיין ציטוט חי זמין.");
  }

  if (lastRsi !== null) {
    lines.push(`RSI(14) נוכחי: ${lastRsi.toFixed(1)}`);
  }

  const activeOverlays: string[] = [];
  overlays.sma.forEach((p) => activeOverlays.push(`SMA ${p}`));
  overlays.ema.forEach((p) => activeOverlays.push(`EMA ${p}`));
  if (overlays.bollinger) {
    activeOverlays.push(
      `Bollinger Bands (${overlays.bollinger.period}, ${overlays.bollinger.mult})`
    );
  }
  lines.push(
    `אינדיקטורים פעילים כרגע על הגרף: ${
      activeOverlays.length ? activeOverlays.join(", ") : "אין"
    }`
  );

  if (position) {
    const entry = position.avgCost ?? position.avgPrice;
    lines.push(
      `למשתמש יש פוזיציה פתוחה ב-${symbol} (מחשבון IBKR מחובר, read-only): כמות ${position.position}` +
        (entry !== undefined ? `, עלות ממוצעת ${entry.toFixed(2)}` : "") +
        (position.unrealizedPnl !== undefined
          ? `, רווח/הפסד לא ממומש ${position.unrealizedPnl.toFixed(2)}`
          : "")
    );
  }

  if (insights.length > 0) {
    lines.push("תובנות אוטומטיות שהאפליקציה זיהתה כרגע (מבוססות כללים, לא נכתבו על ידך):");
    insights.forEach((i) => lines.push(`- ${i.title}: ${i.body}`));
  } else {
    lines.push("לא זוהו תובנות אוטומטיות מיוחדות כרגע.");
  }

  return lines.join("\n");
}
