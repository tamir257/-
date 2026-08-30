import { FaqEntry } from "./types";

// Very common Hebrew question words — excluded so they don't dilute the
// match score (almost every question contains "מה"/"איך" etc., so they
// carry no distinguishing signal).
const STOPWORDS = new Set([
  "מה", "זה", "זו", "את", "של", "על", "אני", "יש", "אין", "לא", "כן",
  "האם", "איך", "למה", "מתי", "איפה", "אם", "או", "עם", "כדי", "כמו",
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

export interface FaqMatch {
  entry: FaqEntry;
  score: number;
}

/**
 * Keyword-overlap search — deliberately simple (no server, no model).
 * Exact word matches score highest; a Hebrew prefix like ה/ו/ל/מ/ש
 * attached to an otherwise-matching word still earns partial credit via
 * the substring check.
 *
 * Scored per QUERY word (how well is each word in the question the user
 * typed covered by this entry), not per entry word — a short, targeted
 * query like "מה זה RSI" must score just as well against a long entry
 * question as against a short one; penalizing by the entry's length
 * would bury a perfect match under an otherwise-detailed builtin question.
 */
export function findBestAnswer(query: string, entries: FaqEntry[]): FaqMatch | null {
  const queryWords = tokenize(query);
  if (queryWords.length === 0) return null;

  let best: FaqMatch | null = null;
  for (const entry of entries) {
    const entryWords = tokenize(entry.question);
    if (entryWords.length === 0) continue;

    let totalPerWordBest = 0;
    for (const qw of queryWords) {
      let bestForWord = 0;
      for (const ew of entryWords) {
        if (qw === ew) bestForWord = Math.max(bestForWord, 2);
        else if (ew.includes(qw) || qw.includes(ew)) bestForWord = Math.max(bestForWord, 1);
      }
      totalPerWordBest += bestForWord;
    }
    // Average match quality per query word: 2 = every word matched exactly,
    // 1 = every word matched at least partially, 0 = nothing in common.
    const score = totalPerWordBest / queryWords.length;
    if (!best || score > best.score) {
      best = { entry, score };
    }
  }

  // Below this, most of the query's words found nothing in common with the entry.
  const MIN_SCORE = 1;
  return best && best.score >= MIN_SCORE ? best : null;
}
