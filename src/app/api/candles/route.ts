import { NextRequest, NextResponse } from "next/server";
import { marketData, Resolution } from "@/lib/marketData";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  const resolution = (req.nextUrl.searchParams.get("resolution") ??
    "daily") as Resolution;

  if (!symbol) {
    return NextResponse.json({ error: "missing symbol" }, { status: 400 });
  }

  try {
    const candles = await marketData.getCandles(symbol, resolution);
    return NextResponse.json({ symbol, candles });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 502 }
    );
  }
}
