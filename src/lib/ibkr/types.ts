// Shapes follow IBKR's publicly documented Client Portal Web API. Kept
// permissive (optional fields) because this integration could not be
// exercised against a real, logged-in gateway from the dev sandbox this
// was built in (see README) — a field name mismatch should degrade
// gracefully instead of crashing the panel.

export interface IbkrAuthStatus {
  authenticated: boolean;
  connected: boolean;
  competing?: boolean;
  message?: string;
}

export interface IbkrAccount {
  id: string;
  accountId?: string;
  displayName?: string;
  currency?: string;
}

export interface IbkrPosition {
  conid: number;
  contractDesc?: string;
  ticker?: string;
  position: number;
  mktPrice?: number;
  mktValue?: number;
  avgCost?: number;
  avgPrice?: number;
  currency?: string;
  unrealizedPnl?: number;
  realizedPnl?: number;
}

export interface IbkrSummaryField {
  amount?: number;
  currency?: string;
  value?: string;
}

export type IbkrSummary = Record<string, IbkrSummaryField | undefined>;

export interface PortfolioResponse {
  accountId: string;
  positions: IbkrPosition[];
  summary: IbkrSummary;
}
