import https from "node:https";
import {
  IbkrAccount,
  IbkrAuthStatus,
  IbkrPosition,
  IbkrSummary,
} from "./types";

const DEFAULT_BASE_URL = "https://localhost:5000/v1/api";

function baseUrl(): string {
  return (process.env.IBKR_GATEWAY_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function isLocalGateway(urlStr: string): boolean {
  try {
    const { hostname } = new URL(urlStr);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/**
 * Raw request to the IBKR Client Portal Gateway. Uses node:https directly
 * (rather than fetch) so we can scope certificate handling precisely: the
 * gateway's default localhost setup uses a self-signed certificate — this
 * is IBKR's own documented local-dev configuration, not something we're
 * loosening for a remote host. Verification stays on for any non-local
 * IBKR_GATEWAY_URL.
 */
function ibkrRequest<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {}
): Promise<T> {
  const url = new URL(baseUrl() + path);
  const insecureOk = isLocalGateway(url.toString());
  const bodyStr = options.body !== undefined ? JSON.stringify(options.body) : undefined;

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: options.method ?? "GET",
        rejectUnauthorized: !insecureOk,
        headers: {
          "Content-Type": "application/json",
          ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (!res.statusCode || res.statusCode >= 400) {
            reject(
              new Error(
                `IBKR gateway החזיר שגיאת HTTP ${res.statusCode}: ${data.slice(0, 300)}`
              )
            );
            return;
          }
          if (!data) {
            resolve(undefined as T);
            return;
          }
          try {
            resolve(JSON.parse(data) as T);
          } catch {
            reject(new Error("תגובה לא תקינה (לא JSON) מה-IBKR Gateway"));
          }
        });
      }
    );

    req.on("error", (err) => {
      reject(
        new Error(
          `לא ניתן להתחבר ל-IBKR Gateway בכתובת ${baseUrl()}: ${err.message}. ודא שה-Gateway רץ.`
        )
      );
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

export function getAuthStatus(): Promise<IbkrAuthStatus> {
  return ibkrRequest<IbkrAuthStatus>("/iserver/auth/status", { method: "POST" });
}

export function tickle(): Promise<unknown> {
  return ibkrRequest("/tickle", { method: "POST" });
}

export async function getAccounts(): Promise<IbkrAccount[]> {
  // IBKR's docs require calling this once after login before any
  // /portfolio/* endpoint returns populated data.
  const data = await ibkrRequest<IbkrAccount[]>("/portfolio/accounts", {
    method: "GET",
  });
  return Array.isArray(data) ? data : [];
}

export async function getPositions(accountId: string): Promise<IbkrPosition[]> {
  const all: IbkrPosition[] = [];
  const PAGE_SIZE = 30; // IBKR's documented page size; used only as a "was this the last page" heuristic
  for (let page = 0; page < 20; page++) {
    const pagePositions = await ibkrRequest<IbkrPosition[]>(
      `/portfolio/${encodeURIComponent(accountId)}/positions/${page}`,
      { method: "GET" }
    );
    if (!Array.isArray(pagePositions) || pagePositions.length === 0) break;
    all.push(...pagePositions);
    if (pagePositions.length < PAGE_SIZE) break;
  }
  return all;
}

export function getSummary(accountId: string): Promise<IbkrSummary> {
  return ibkrRequest<IbkrSummary>(
    `/portfolio/${encodeURIComponent(accountId)}/summary`,
    { method: "GET" }
  );
}
