import { stooqProvider } from "./stooq";
import { MarketDataProvider } from "./types";

// Single switch point: to move to a paid real-time provider later,
// implement MarketDataProvider in a new file and swap the export below.
export const marketData: MarketDataProvider = stooqProvider;

export * from "./types";
