// Technical-analysis indicator calculations.
// Every function takes plain numeric arrays (closes, highs, lows, volumes)
// aligned by index, and returns an array of the same length where indices
// that don't have enough history yet are `null`. This keeps indicators
// trivial to unit test and decoupled from the charting library.

export type Series = (number | null)[];

export function sma(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

export function ema(values: number[], period: number): Series {
  const out: Series = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i === period - 1) {
      // Seed with a simple average of the first `period` values.
      const seed =
        values.slice(0, period).reduce((a, b) => a + b, 0) / period;
      prev = seed;
      out[i] = seed;
    } else if (i >= period) {
      prev = values[i] * k + (prev as number) * (1 - k);
      out[i] = prev;
    }
  }
  return out;
}

export function rsi(values: number[], period = 14): Series {
  const out: Series = new Array(values.length).fill(null);
  if (values.length <= period) return out;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change >= 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export interface MacdResult {
  macd: Series;
  signal: Series;
  histogram: Series;
}

export function macd(
  values: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): MacdResult {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine: Series = values.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null
      ? (emaFast[i] as number) - (emaSlow[i] as number)
      : null
  );

  // EMA of the MACD line, computed only over its non-null tail.
  const firstValid = macdLine.findIndex((v) => v !== null);
  const signal: Series = new Array(values.length).fill(null);
  if (firstValid !== -1) {
    const tail = macdLine.slice(firstValid) as number[];
    const signalTail = ema(tail, signalPeriod);
    signalTail.forEach((v, i) => (signal[firstValid + i] = v));
  }

  const histogram: Series = values.map((_, i) =>
    macdLine[i] != null && signal[i] != null
      ? (macdLine[i] as number) - (signal[i] as number)
      : null
  );

  return { macd: macdLine, signal, histogram };
}

export interface BollingerResult {
  upper: Series;
  middle: Series;
  lower: Series;
}

export function bollingerBands(
  values: number[],
  period = 20,
  stdDevMultiplier = 2
): BollingerResult {
  const middle = sma(values, period);
  const upper: Series = new Array(values.length).fill(null);
  const lower: Series = new Array(values.length).fill(null);

  for (let i = period - 1; i < values.length; i++) {
    const window = values.slice(i - period + 1, i + 1);
    const mean = middle[i] as number;
    const variance =
      window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);
    upper[i] = mean + stdDevMultiplier * stdDev;
    lower[i] = mean - stdDevMultiplier * stdDev;
  }

  return { upper, middle, lower };
}

/** Volume-weighted average price, cumulative from the start of the series. */
export function vwap(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[]
): Series {
  const out: Series = new Array(closes.length).fill(null);
  let cumulativePV = 0;
  let cumulativeVolume = 0;
  for (let i = 0; i < closes.length; i++) {
    const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
    cumulativePV += typicalPrice * volumes[i];
    cumulativeVolume += volumes[i];
    out[i] = cumulativeVolume === 0 ? null : cumulativePV / cumulativeVolume;
  }
  return out;
}
