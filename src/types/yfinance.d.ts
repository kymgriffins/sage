declare module 'yfinance' {
  export interface YFQuote {
    price: {
      regularMarketPrice?: number;
      regularMarketChange?: number;
      regularMarketChangePercent?: number;
      regularMarketVolume?: number;
    };
    summaryDetail?: {
      fiftyTwoWeekHigh?: number;
      fiftyTwoWeekLow?: number;
    };
    shortName?: string;
    longName?: string;
  }

  export function quote(symbol: string): Promise<YFQuote>;
}
