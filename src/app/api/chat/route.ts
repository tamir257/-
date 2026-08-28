import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/claude/client";
import { CHAT_SYSTEM_PROMPT } from "@/lib/claude/systemPrompt";

export const runtime = "nodejs";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatTurn[];
  context: string;
}

function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return "מפתח ה-ANTHROPIC_API_KEY שגוי או פג תוקף. בדוק את קובץ ה-.env.local.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "חריגה ממכסת הבקשות ל-Claude API כרגע — נסה שוב בעוד רגע.";
  }
  if (err instanceof Anthropic.APIError) {
    return `שגיאת Claude API (${err.status}): ${err.message}`;
  }
  if (err instanceof Error) return err.message;
  return "שגיאה לא ידועה בפנייה ל-Claude.";
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      "מפתח Anthropic API לא מוגדר בשרת. הוסף ANTHROPIC_API_KEY לקובץ .env.local והפעל מחדש (ראה README).",
      { status: 500 }
    );
  }

  const body = (await req.json()) as ChatRequestBody;
  const history = body.messages ?? [];
  const lastTurn = history[history.length - 1];
  if (!lastTurn || lastTurn.role !== "user") {
    return new Response("לא התקבלה הודעת משתמש", { status: 400 });
  }

  // The live chart/portfolio context rides on the latest user turn only —
  // earlier turns stay byte-for-byte stable so the cached system prompt
  // prefix keeps matching across the conversation.
  const messages: Anthropic.MessageParam[] = history.map((turn, i) =>
    i === history.length - 1
      ? {
          role: "user" as const,
          content: `[הקשר נוכחי בפלטפורמה]\n${body.context}\n\n[שאלת המשתמש]\n${turn.content}`,
        }
      : { role: turn.role, content: turn.content }
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const claudeStream = anthropic.messages.stream({
          model: "claude-opus-5",
          max_tokens: 2048,
          output_config: { effort: "medium" },
          system: [
            {
              type: "text",
              text: CHAT_SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages,
        });

        claudeStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        await claudeStream.finalMessage();
      } catch (err) {
        controller.enqueue(encoder.encode(`\n\n⚠️ ${describeError(err)}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
