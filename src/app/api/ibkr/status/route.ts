import { NextResponse } from "next/server";
import { getAuthStatus } from "@/lib/ibkr/client";

export async function GET() {
  try {
    const status = await getAuthStatus();
    return NextResponse.json(status);
  } catch (err) {
    // Not being able to reach the gateway is the expected/common state
    // (not started yet, or not logged in) — not a server error.
    return NextResponse.json({
      authenticated: false,
      connected: false,
      message: err instanceof Error ? err.message : "שגיאה לא ידועה",
    });
  }
}
