"use client";

import { useState } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Streams a chat reply from /api/chat, appending text chunks as they arrive. */
export function useChat(buildContext: () => string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);

  async function send(userText: string) {
    const withUserTurn: ChatMessage[] = [
      ...messages,
      { role: "user", content: userText },
    ];
    setMessages([...withUserTurn, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: withUserTurn,
          context: buildContext(),
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(await res.text());
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        const textSoFar = assistantText;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: textSoFar };
          return next;
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "שגיאה לא צפויה";
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: `⚠️ ${message}` };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  return { messages, send, streaming };
}
