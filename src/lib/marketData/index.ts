import { yahooFinanceProvider } from "./yahoo";
import { MarketDataProvider } from "./types";

// Single switch point: to move to a paid real-time provider later (or back
// to Stooq for a home/local run — it works fine there, just not from
// cloud/serverless IPs), implement MarketDataProvider in a new file and
// swap the export below.
export const marketData: MarketDataProvider = yahooFinanceProvider;

export * from "./types";
