import { Candle } from "@/lib/marketData";
import { bollingerBands, macd, rsi, sma } from "@/lib/indicators";

export interface Insight {
  id: string;
  tone: "info" | "warning";
  title: string;
  body: string;
}

/**
 * Rule-based, plain-language reading of the most recent bar — the passive
 * "guidance" layer for a novice. Deliberately not an AI chat: fixed rules
 * over well-known technical-analysis signals, always phrased as
 * observations rather than buy/sell instructions.
 */
export function generateInsights(candles: Candle[]): Insight[] {
  if (candles.length < 30) return [];

  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);
  const n = closes.length;
  const insights: Insight[] = [];

  // --- RSI zones ---
  const rsiValues = rsi(closes, 14);
  const lastRsi = rsiValues[n - 1];
  if (lastRsi !== null) {
    if (lastRsi >= 70) {
      insights.push({
        id: "rsi-overbought",
        tone: "warning",
        title: "RSI באזור קניית יתר",
        body: `ה-RSI עומד על ${lastRsi.toFixed(0)}, מעל 70. יש שרואים בכך סימן אפשרי להאטה או תיקון קרוב — לא איתות אוטומטי למכירה.`,
      });
    } else if (lastRsi <= 30) {
      insights.push({
        id: "rsi-oversold",
        tone: "warning",
        title: "RSI באזור מכירת יתר",
        body: `ה-RSI עומד על ${lastRsi.toFixed(0)}, מתחת ל-30. יש שרואים בכך סימן אפשרי להיפוך כלפי מעלה — לא איתות אוטומטי לקנייה.`,
      });
    }
  }

  // --- MACD crossover on the most recent bar ---
  const { histogram } = macd(closes);
  const lastHist = histogram[n - 1];
  const prevHist = histogram[n - 2];
  if (lastHist !== null && prevHist !== null) {
    if (prevHist <= 0 && lastHist > 0) {
      insights.push({
        id: "macd-cross-up",
        tone: "info",
        title: "MACD חצה את קו האיתות כלפי מעלה",
        body: "מכונה לפעמים 'הצלבה עולה' — יש שמפרשים זאת כחיזוק אפשרי במומנטום. שווה להסתכל גם על הנפח והמגמה הכללית לפני מסקנות.",
      });
    } else if (prevHist >= 0 && lastHist < 0) {
      insights.push({
        id: "macd-cross-down",
        tone: "info",
        title: "MACD חצה את קו האיתות כלפי מטה",
        body: "מכונה לפעמים 'הצלבת דובים' — יש שמפרשים זאת כהיחלשות אפשרית במומנטום.",
      });
    }
  }

  // --- SMA20/SMA50 golden/death cross ---
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const s20now = sma20[n - 1];
  const s20prev = sma20[n - 2];
  const s50now = sma50[n - 1];
  const s50prev = sma50[n - 2];
  if (s20now !== null && s20prev !== null && s50now !== null && s50prev !== null) {
    if (s20prev <= s50prev && s20now > s50now) {
      insights.push({
        id: "golden-cross",
        tone: "info",
        title: "הצלבת זהב (SMA 20 מעל SMA 50)",
        body: "הממוצע הנע הקצר (20) חצה כלפי מעלה את הממוצע הארוך (50) — תבנית שנחשבת לרוב חיובית לטווח בינוני, בהתאם להקשר הכללי.",
      });
    } else if (s20prev >= s50prev && s20now < s50now) {
      insights.push({
        id: "death-cross",
        tone: "warning",
        title: "הצלבת מוות (SMA 20 מתחת ל-SMA 50)",
        body: "הממוצע הנע הקצר (20) חצה כלפי מטה את הממוצע הארוך (50) — תבנית שנחשבת לרוב שלילית לטווח בינוני, בהתאם להקשר הכללי.",
      });
    }
  }

  // --- Bollinger Band touch ---
  const { upper, lower } = bollingerBands(closes, 20, 2);
  const lastClose = closes[n - 1];
  const lastUpper = upper[n - 1];
  const lastLower = lower[n - 1];
  if (lastUpper !== null && lastClose >= lastUpper) {
    insights.push({
      id: "bb-upper-touch",
      tone: "info",
      title: "המחיר נגע ברצועה העליונה של בולינגר",
      body: "המחיר קרוב או מעל הרצועה העליונה — יקר יחסית לתנודתיות האחרונה. לא בהכרח סימן להיפוך.",
    });
  } else if (lastLower !== null && lastClose <= lastLower) {
    insights.push({
      id: "bb-lower-touch",
      tone: "info",
      title: "המחיר נגע ברצועה התחתונה של בולינגר",
      body: "המחיר קרוב או מתחת לרצועה התחתונה — זול יחסית לתנודתיות האחרונה. לא בהכרח סימן להיפוך.",
    });
  }

  // --- Volume spike ---
  const lookback = Math.min(20, n - 1);
  const avgVolume =
    volumes.slice(n - 1 - lookback, n - 1).reduce((a, b) => a + b, 0) /
    lookback;
  const lastVolume = volumes[n - 1];
  if (avgVolume > 0 && lastVolume > avgVolume * 2) {
    insights.push({
      id: "volume-spike",
      tone: "info",
      title: "נפח מסחר חריג",
      body: `הנפח האחרון גבוה פי ${(lastVolume / avgVolume).toFixed(1)} מהממוצע ב-20 הימים האחרונים — לרוב מעיד על עניין חריג במניה.`,
    });
  }

  return insights;
}
