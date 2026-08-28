import { NextResponse } from "next/server";
import { tickle } from "@/lib/ibkr/client";

// Keeps the browser-authenticated gateway session alive while the app is
// open (the gateway logs out after a few idle minutes without this).
// Polled from useIbkrPortfolio — failures here are expected whenever the
// gateway isn't running and shouldn't surface as app errors.
export async function POST() {
  try {
    await tickle();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: err instanceof Error ? err.message : "שגיאה לא ידועה",
    });
  }
}
