import { NextRequest, NextResponse } from "next/server";
import { marketData } from "@/lib/marketData";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  }

  try {
    const quote = await marketData.getQuote(symbol);
    return NextResponse.json(quote);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 }
    );
  }
}
