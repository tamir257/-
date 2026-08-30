"use client";

import { useEffect, useRef, useState } from "react";
import { FaqEntry } from "@/lib/faq/types";
import { findBestAnswer } from "@/lib/faq/match";

interface Props {
  entries: FaqEntry[];
  onAddEntry: (question: string, answer: string) => void;
  onRemoveEntry: (id: string) => void;
}

interface Exchange {
  question: string;
  answer: string | null; // null = no match found
}

const SUGGESTIONS = ["מה זה RSI", "מה זה נר ירוק ואדום", "איך מוסיפים מניה לרשימת מעקב"];

export default function FaqPanel({ entries, onAddEntry, onRemoveEntry }: Props) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Exchange[]>([]);
  const [manageOpen, setManageOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const customEntries = entries.filter((e) => !e.builtin);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  function ask(question?: string) {
    const q = (question ?? input).trim();
    if (!q) return;
    const match = findBestAnswer(q, entries);
    setHistory((prev) => [...prev, { question: q, answer: match?.entry.answer ?? null }]);
    setInput("");
  }

  function handleAddEntry() {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    onAddEntry(newQuestion, newAnswer);
    setNewQuestion("");
    setNewAnswer("");
  }

  return (
    <div className="flex h-72 flex-col border-t border-gray-800">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1.5">
        <span className="text-xs font-semibold text-gray-300">
          📚 שאלות ותשובות — חינמי לחלוטין
        </span>
        <button
          onClick={() => setManageOpen((v) => !v)}
          className="text-[10px] text-gray-500 underline hover:text-gray-300"
        >
          {manageOpen ? "סגור ניהול" : "נהל את המאגר"}
        </button>
      </div>

      {manageOpen ? (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="mb-2 flex flex-col gap-1">
            <input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="שאלה חדשה..."
              className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-100 outline-none placeholder:text-gray-500"
            />
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="התשובה שתופיע כשמישהו ישאל שאלה דומה..."
              rows={2}
              className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-100 outline-none placeholder:text-gray-500"
            />
            <button
              onClick={handleAddEntry}
              className="self-start rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
            >
              הוסף למאגר
            </button>
          </div>
          <div className="text-[10px] text-gray-500">השאלות שלך:</div>
          <ul className="mt-1 flex flex-col gap-1">
            {customEntries.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded bg-gray-900 px-2 py-1 text-[11px] text-gray-300"
              >
                <span className="truncate">{e.question}</span>
                <button
                  onClick={() => onRemoveEntry(e.id)}
                  className="px-1 text-gray-500 hover:text-red-400"
                >
                  ✕
                </button>
              </li>
            ))}
            {customEntries.length === 0 && (
              <li className="text-[11px] text-gray-600">
                עוד לא הוספת שאלות משלך.
              </li>
            )}
          </ul>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {history.length === 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-600">
                  חיפוש מבוסס מילות מפתח במאגר מוכן מראש — לא AI, אבל חינמי
                  לגמרי. נסה:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {history.map((h, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="max-w-[85%] self-start rounded bg-blue-600 px-2 py-1.5 text-xs text-white">
                    {h.question}
                  </div>
                  <div className="max-w-[85%] self-end whitespace-pre-wrap rounded bg-gray-800 px-2 py-1.5 text-xs leading-relaxed text-gray-100">
                    {h.answer ??
                      "לא מצאתי תשובה מתאימה במאגר. אפשר לנסח אחרת, או להוסיף את השאלה הזו למאגר (\"נהל את המאגר\" למעלה)."}
                  </div>
                </div>
              ))}
            </div>
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-1 border-t border-gray-800 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="שאל שאלה מהמאגר..."
              className="w-full rounded bg-gray-800 px-2 py-1 text-sm text-gray-100 outline-none placeholder:text-gray-500"
            />
            <button
              onClick={() => ask()}
              className="rounded bg-blue-600 px-3 text-sm text-white hover:bg-blue-500"
            >
              שאל
            </button>
          </div>
        </>
      )}
    </div>
  );
}
