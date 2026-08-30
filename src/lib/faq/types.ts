export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  /** Built-in entries ship with the app; they can't be deleted (only your own can). */
  builtin?: boolean;
}
