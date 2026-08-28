"use client";

import { useEffect, useState } from "react";
import { IbkrPosition, IbkrSummary } from "@/lib/ibkr/types";

export type IbkrConnectionState = "disconnected" | "unauthenticated" | "connected";

interface State {
  connection: IbkrConnectionState;
  positions: IbkrPosition[];
  summary: IbkrSummary | null;
  accountId: string | null;
  error: string | null;
}

const STATUS_INTERVAL_MS = 15_000;
const PORTFOLIO_INTERVAL_MS = 30_000;
const TICKLE_INTERVAL_MS = 50_000; // keep the gateway session from idling out

export function useIbkrPortfolio() {
  const [state, setState] = useState<State>({
    connection: "disconnected",
    positions: [],
    summary: null,
    accountId: null,
    error: null,
  });

  // Auth status polling — cheap, tells us whether it's even worth asking
  // for portfolio data.
  useEffect(() => {
    let cancelled = false;

    async function pollStatus() {
      try {
        const res = await fetch("/api/ibkr/status", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          connection: data.authenticated
            ? "connected"
            : data.connected
              ? "unauthenticated"
              : "disconnected",
          error: data.authenticated ? null : (data.message ?? null),
        }));
      } catch {
        if (cancelled) return;
        setState((prev) => ({ ...prev, connection: "disconnected" }));
      }
    }

    pollStatus();
    const id = setInterval(pollStatus, STATUS_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Portfolio data — only worth fetching once authenticated.
  useEffect(() => {
    if (state.connection !== "connected") return;
    let cancelled = false;

    async function pollPortfolio() {
      try {
        const res = await fetch("/api/ibkr/portfolio", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error ?? "שגיאה בשליפת תיק");
        setState((prev) => ({
          ...prev,
          positions: data.positions ?? [],
          summary: data.summary ?? null,
          accountId: data.accountId ?? null,
          error: null,
        }));
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "שגיאה לא ידועה",
        }));
      }
    }

    pollPortfolio();
    const id = setInterval(pollPortfolio, PORTFOLIO_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [state.connection]);

  // Keep-alive — only while a session actually exists.
  useEffect(() => {
    if (state.connection === "disconnected") return;
    const id = setInterval(() => {
      fetch("/api/ibkr/tickle", { method: "POST" }).catch(() => {
        // best-effort — the status poll will notice if the session died
      });
    }, TICKLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [state.connection]);

  return state;
}
