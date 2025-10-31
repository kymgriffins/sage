// Client-safe types for market data (no server dependencies)
export type AssetType = 'stock' | 'forex' | 'futures' | 'commodity';

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high52?: number;
  low52?: number;
  timestamp: Date;
  assetType: AssetType;
}

export const TOP_MARKETS = {
  forex: ['EURUSD', 'GBPUSD', 'USDJPY'],
  futures: ['NQ', 'YM', 'ES'],
  commodities: ['GC=F', 'SI=F', 'CL=F'], // Gold, Silver, Crude Oil
  stocks: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'],
} as const;

export type MarketCategory = keyof typeof TOP_MARKETS;
