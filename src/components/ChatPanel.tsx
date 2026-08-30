"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@/hooks/useChat";

interface Props {
  buildContext: () => string;
}

const QUICK_QUESTIONS = [
  "מה אני רואה בגרף הזה?",
  "האם המניה במגמת עלייה או ירידה?",
  "תסביר לי את האינדיקטורים שמופעלים כרגע",
  "מה זה RSI ולמה זה חשוב?",
];

export default function ChatPanel({ buildContext }: Props) {
  const { messages, send, streaming } = useChat(buildContext);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(text?: string) {
    const clean = (text ?? input).trim();
    if (!clean || streaming) return;
    setInput("");
    send(clean);
  }

  return (
    <div className="flex h-72 flex-col border-t border-gray-800">
      <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1.5">
        <span className="text-xs font-semibold text-gray-300">
          🤖 עוזר AI — שואל על מה שרואים בגרף הפתוח
        </span>
        <span className="text-[10px] text-gray-600">
          כלי חינוכי בלבד · לא ייעוץ השקעות
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-gray-600">
              לא בטוח מה לשאול? תלחץ על אחת מהשאלות המוכנות:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-wrap rounded px-2 py-1.5 text-xs leading-relaxed ${
                m.role === "user"
                  ? "self-start bg-blue-600 text-white"
                  : "self-end bg-gray-800 text-gray-100"
              }`}
            >
              {m.content ||
                (streaming && i === messages.length - 1 ? "…" : "")}
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-1 border-t border-gray-800 p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="שאל שאלה על הגרף..."
          disabled={streaming}
          className="w-full rounded bg-gray-800 px-2 py-1 text-sm text-gray-100 outline-none placeholder:text-gray-500 disabled:opacity-50"
        />
        <button
          onClick={() => handleSend()}
          disabled={streaming}
          className="rounded bg-blue-600 px-3 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
        >
          שלח
        </button>
      </div>
    </div>
  );
}
