import { IndicatorPreset } from "./types";

/**
 * Ready-made presets shipped with the app — for someone who doesn't know
 * what an indicator even is yet, "pick one of these" is a much lower bar
 * than "configure your own." Not stored in localStorage, always shown
 * first, not deletable.
 */
export const BUILTIN_PRESETS: IndicatorPreset[] = [
  {
    id: "builtin-beginner",
    name: "🔰 למתחילים",
    description: "התחלה פשוטה: מגמה כללית (ממוצע נע) ונפח מסחר, בלי עומס.",
    overlays: { sma: [20], ema: [], bollinger: null, volume: true },
    showRSI: false,
    showMACD: false,
    builtin: true,
  },
  {
    id: "builtin-trend",
    name: "📈 מעקב מגמה",
    description:
      "משווה מגמה קצרה מול ארוכה (SMA 20/50) ומוסיף MACD כדי לראות שינויי כיוון.",
    overlays: { sma: [20, 50], ema: [], bollinger: null, volume: true },
    showRSI: false,
    showMACD: true,
    builtin: true,
  },
  {
    id: "builtin-volatility",
    name: "🌊 תנודתיות",
    description:
      "רצועות בולינגר מראות אם המחיר \"יקר\" או \"זול\" יחסית לאחרונה, עם RSI לבדיקת קניית/מכירת יתר.",
    overlays: { sma: [], ema: [], bollinger: { period: 20, mult: 2 }, volume: true },
    showRSI: true,
    showMACD: false,
    builtin: true,
  },
];
