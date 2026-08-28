import { NextRequest, NextResponse } from "next/server";
import { getAccounts, getPositions, getSummary } from "@/lib/ibkr/client";

export async function GET(req: NextRequest) {
  try {
    const accounts = await getAccounts();
    if (accounts.length === 0) {
      return NextResponse.json(
        { error: "לא נמצא חשבון מחובר — ודא שהתחברת ב-https://localhost:5000" },
        { status: 409 }
      );
    }

    const requested = req.nextUrl.searchParams.get("accountId");
    const account =
      accounts.find((a) => a.id === requested || a.accountId === requested) ??
      accounts[0];
    const accountId = account.accountId ?? account.id;

    const [positions, summary] = await Promise.all([
      getPositions(accountId),
      getSummary(accountId),
    ]);

    return NextResponse.json({ accountId, positions, summary, accounts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "שגיאה לא ידועה" },
      { status: 502 }
    );
  }
}
