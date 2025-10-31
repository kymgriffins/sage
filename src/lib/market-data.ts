import axios from 'axios';
import YahooFinance from 'yahoo-finance2';

// Market data types
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

export interface MarketInsights {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  pe?: number;
  eps?: number;
  dividend?: number;
  yield?: number;
  beta?: number;
  analystRating?: {
    rating: string;
    priceTarget: number;
  };
  news?: {
    title: string;
    source: string;
    time: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];
  weeklyRange?: {
    current: number;
    high52: number;
    low52: number;
    position: string;
  };
  earnings?: {
    actual: number;
    estimate: number;
    surprise: number;
    date: string;
  };
  bid?: number;
  ask?: number;
  spread?: number;
  assetType: AssetType;
  timestamp: Date;
}

// Provider interfaces
export interface MarketDataProvider {
  name: string;
  isFree: boolean;
  rateLimit?: number;
  fetchData(symbol: string, assetType: AssetType): Promise<MarketData>;
  fetchBatchData?(symbols: string[], assetType: AssetType): Promise<MarketData[]>;
}

// Yahoo Finance provider (Free) - Using mock data for now due to library issues
class YahooFinanceProvider implements MarketDataProvider {
  name = 'Yahoo Finance';
  isFree = true;
  rateLimit = 2000; // requests per hour

  async fetchData(symbol: string, assetType: AssetType): Promise<MarketData> {
    try {
      console.log(`📊 Fetching ${assetType} data for ${symbol} from Yahoo Finance (Mock)`);

      // Generate realistic mock data based on asset type
      const mockData = this.generateMockData(symbol, assetType);

      return mockData;
    } catch (error) {
      console.error(`Yahoo Finance error for ${symbol}:`, error);
      throw new Error(`Failed to fetch data from Yahoo Finance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateMockData(symbol: string, assetType: AssetType): MarketData {
    // Base prices for different asset types
    const basePrices: Record<string, number> = {
      // Stocks
      'AAPL': 225.0, 'GOOGL': 165.0, 'MSFT': 415.0, 'TSLA': 250.0, 'NVDA': 875.0,
      // Forex
      'EURUSD': 1.085, 'GBPUSD': 1.275, 'USDJPY': 152.50,
      // Futures
      'NQ': 18500, 'YM': 42500, 'ES': 5700,
      // Commodities
      'GC=F': 2750, 'SI=F': 32.50, 'CL=F': 68.50,
    };

    const basePrice = basePrices[symbol] || (assetType === 'forex' ? 1.0 : assetType === 'commodity' ? 100 : 100);

    // Generate realistic price movements
    const volatility = assetType === 'forex' ? 0.02 : assetType === 'commodity' ? 0.05 : 0.08;
    const change = (Math.random() - 0.5) * volatility * basePrice;
    const price = Math.max(basePrice + change, 0.01);
    const changePercent = (change / basePrice) * 100;

    // Generate realistic volume based on asset type
    const volume = assetType === 'stock' ? Math.floor(Math.random() * 100000000) + 10000000 :
                   assetType === 'forex' ? Math.floor(Math.random() * 1000000) + 100000 :
                   assetType === 'futures' ? Math.floor(Math.random() * 100000) + 10000 :
                   Math.floor(Math.random() * 10000) + 1000;

    // Generate 52-week range
    const high52 = basePrice * (1 + Math.random() * 0.3 + 0.1);
    const low52 = basePrice * (1 - Math.random() * 0.25 - 0.05);

    // Generate asset name
    const names: Record<string, string> = {
      'AAPL': 'Apple Inc.', 'GOOGL': 'Alphabet Inc.', 'MSFT': 'Microsoft Corporation',
      'TSLA': 'Tesla, Inc.', 'NVDA': 'NVIDIA Corporation',
      'EURUSD': 'EUR/USD', 'GBPUSD': 'GBP/USD', 'USDJPY': 'USD/JPY',
      'NQ': 'Nasdaq-100 Futures', 'YM': 'Dow Jones Futures', 'ES': 'S&P 500 Futures',
      'GC=F': 'Gold Futures', 'SI=F': 'Silver Futures', 'CL=F': 'Crude Oil Futures',
    };

    return {
      symbol: symbol.toUpperCase(),
      name: names[symbol] || `${symbol} ${assetType.charAt(0).toUpperCase() + assetType.slice(1)}`,
      price: Number(price.toFixed(assetType === 'forex' ? 4 : 2)),
      change: Number(change.toFixed(assetType === 'forex' ? 4 : 2)),
      changePercent: Number(changePercent.toFixed(2)),
      volume,
      high52: Number(high52.toFixed(2)),
      low52: Number(low52.toFixed(2)),
      assetType,
      timestamp: new Date(),
    };
  }

  async fetchBatchData(symbols: string[], assetType: AssetType): Promise<MarketData[]> {
    const promises = symbols.map(symbol => this.fetchData(symbol, assetType));
    return Promise.allSettled(promises).then(results =>
      results
        .filter((result): result is PromiseFulfilledResult<MarketData> => result.status === 'fulfilled')
        .map(result => result.value)
    );
  }
}

// Alpha Vantage provider (Paid - Boilerplate)
class AlphaVantageProvider implements MarketDataProvider {
  name = 'Alpha Vantage';
  isFree = false;
  rateLimit = 5; // requests per minute for free tier

  constructor(private apiKey?: string) {}

  async fetchData(symbol: string, assetType: AssetType): Promise<MarketData> {
    if (!this.apiKey) {
      throw new Error('Alpha Vantage API key not configured');
    }

    try {
      console.log(`📊 Fetching ${assetType} data for ${symbol} from Alpha Vantage`);

      let functionName = 'GLOBAL_QUOTE';
      let symbolParam = symbol;

      // Map asset types to Alpha Vantage functions
      if (assetType === 'forex') {
        functionName = 'CURRENCY_EXCHANGE_RATE';
        symbolParam = symbol; // e.g., 'EURUSD'
      } else if (assetType === 'commodity') {
        // Commodities might need different handling
        functionName = 'GLOBAL_QUOTE';
      }

      const url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbolParam}&apikey=${this.apiKey}`;

      const response = await axios.get(url);
      const data = response.data;

      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }

      // Parse response based on function
      if (functionName === 'GLOBAL_QUOTE') {
        const quote = data['Global Quote'];
        return {
          symbol: symbol.toUpperCase(),
          name: `${symbol} Stock`,
          price: parseFloat(quote['05. price']) || 0,
          change: parseFloat(quote['09. change']) || 0,
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')) || 0,
          volume: parseInt(quote['06. volume']) || 0,
          assetType,
          timestamp: new Date(),
        };
      } else if (functionName === 'CURRENCY_EXCHANGE_RATE') {
        const rate = data['Realtime Currency Exchange Rate'];
        return {
          symbol: symbol.toUpperCase(),
          name: `${rate['2. From_Currency Name']} to ${rate['4. To_Currency Name']}`,
          price: parseFloat(rate['5. Exchange Rate']) || 0,
          change: 0, // Alpha Vantage doesn't provide change for forex
          changePercent: 0,
          assetType,
          timestamp: new Date(),
        };
      }

      throw new Error('Unsupported function response');
    } catch (error) {
      console.error(`Alpha Vantage error for ${symbol}:`, error);
      throw new Error(`Failed to fetch data from Alpha Vantage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Polygon.io provider (Paid - Boilerplate)
class PolygonProvider implements MarketDataProvider {
  name = 'Polygon.io';
  isFree = false;
  rateLimit = 5; // requests per minute for free tier

  constructor(private apiKey?: string) {}

  async fetchData(symbol: string, assetType: AssetType): Promise<MarketData> {
    if (!this.apiKey) {
      throw new Error('Polygon.io API key not configured');
    }

    try {
      console.log(`📊 Fetching ${assetType} data for ${symbol} from Polygon.io`);

      let endpoint = 'quotes';
      let symbolParam = symbol;

      // Map asset types to Polygon endpoints
      if (assetType === 'forex') {
        endpoint = 'quotes';
        symbolParam = `C:${symbol}`;
      } else if (assetType === 'futures') {
        endpoint = 'quotes';
        // Futures symbols might need adjustment
      }

      const url = `https://api.polygon.io/v2/${endpoint}/${symbolParam}/last?apikey=${this.apiKey}`;

      const response = await axios.get(url);
      const data = response.data;

      if (data.status !== 'OK') {
        throw new Error(data.error || 'API request failed');
      }

      return {
        symbol: symbol.toUpperCase(),
        name: `${symbol} ${assetType.charAt(0).toUpperCase() + assetType.slice(1)}`,
        price: data.last?.price || 0,
        change: 0, // Would need previous close to calculate
        changePercent: 0,
        volume: data.last?.size || 0,
        assetType,
        timestamp: new Date(data.last?.timestamp / 1000000 || Date.now()), // Convert nanoseconds to milliseconds
      };
    } catch (error) {
      console.error(`Polygon.io error for ${symbol}:`, error);
      throw new Error(`Failed to fetch data from Polygon.io: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Market Data Service
export class MarketDataService {
  private providers: Map<string, MarketDataProvider> = new Map();
  private defaultProvider: string = 'yfinance';

  constructor() {
    // Initialize providers
    this.providers.set('yfinance', new YahooFinanceProvider());
    this.providers.set('alphavantage', new AlphaVantageProvider(process.env.ALPHA_VANTAGE_API_KEY));
    this.providers.set('polygon', new PolygonProvider(process.env.POLYGON_API_KEY));
  }

  setDefaultProvider(providerName: string): void {
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider ${providerName} not found`);
    }
    this.defaultProvider = providerName;
  }

  async fetchMarketData(
    symbol: string,
    assetType: AssetType = 'stock',
    providerName?: string
  ): Promise<MarketData> {
    const provider = this.providers.get(providerName || this.defaultProvider);
    if (!provider) {
      throw new Error(`Provider ${providerName || this.defaultProvider} not found`);
    }

    return provider.fetchData(symbol, assetType);
  }

  async fetchBatchMarketData(
    symbols: string[],
    assetType: AssetType = 'stock',
    providerName?: string
  ): Promise<MarketData[]> {
    const provider = this.providers.get(providerName || this.defaultProvider);
    if (!provider) {
      throw new Error(`Provider ${providerName || this.defaultProvider} not found`);
    }

    if (provider.fetchBatchData) {
      return provider.fetchBatchData(symbols, assetType);
    }

    // Fallback to individual requests
    const promises = symbols.map(symbol => provider.fetchData(symbol, assetType));
    return Promise.allSettled(promises).then(results =>
      results
        .filter((result): result is PromiseFulfilledResult<MarketData> => result.status === 'fulfilled')
        .map(result => result.value)
    );
  }

  async fetchMarketInsights(
    symbol: string,
    assetType: AssetType = 'stock',
    providerName?: string
  ): Promise<MarketInsights> {
    // For now, use YFinance for detailed insights
    // In production, this would aggregate data from multiple sources
    const basicData = await this.fetchMarketData(symbol, assetType, 'yfinance');

    // Generate additional insights (this would be enhanced with real APIs)
    const insights: MarketInsights = {
      ...basicData,
      marketCap: assetType === 'stock' ? Math.floor(Math.random() * 1000000000000) + 1000000000 : undefined,
      pe: assetType === 'stock' ? Number((Math.random() * 50 + 5).toFixed(2)) : undefined,
      eps: assetType === 'stock' ? Number((Math.random() * 10 + 1).toFixed(2)) : undefined,
      dividend: assetType === 'stock' && Math.random() > 0.7 ? Number((Math.random() * 5).toFixed(2)) : undefined,
      yield: assetType === 'stock' && Math.random() > 0.7 ? Number((Math.random() * 5).toFixed(2)) : undefined,
      beta: assetType === 'stock' ? Number((Math.random() * 2 + 0.5).toFixed(2)) : undefined,
      analystRating: assetType === 'stock' ? {
        rating: ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'][Math.floor(Math.random() * 5)],
        priceTarget: basicData.price * (1 + (Math.random() * 0.4 - 0.2)),
      } : undefined,
      news: assetType === 'stock' ? Array.from({ length: 3 }, () => ({
        title: [
          `${symbol} Q${Math.floor(Math.random() * 4) + 1} Earnings ${Math.random() > 0.5 ? 'Beat' : 'Miss'} Expectations`,
          `${symbol} Announces Strategic ${['Partnership', 'Acquisition', 'Investment'][Math.floor(Math.random() * 3)]}`,
          `Analysts ${['Upgrade', 'Downgrade', 'Maintain'][Math.floor(Math.random() * 3)]} ${symbol}`,
        ][Math.floor(Math.random() * 3)],
        source: ['Bloomberg', 'Reuters', 'CNBC', 'WSJ'][Math.floor(Math.random() * 4)],
        time: `${Math.floor(Math.random() * 24)}h ago`,
        sentiment: (Math.random() > 0.5 ? 'positive' : Math.random() > 0.25 ? 'neutral' : 'negative') as 'positive' | 'negative' | 'neutral',
      })) : undefined,
      weeklyRange: {
        current: basicData.price,
        high52: basicData.high52 || basicData.price * 1.2,
        low52: basicData.low52 || basicData.price * 0.8,
        position: basicData.price > (basicData.high52 || basicData.price * 1.2) * 0.9 ? 'HIGH' :
                 basicData.price < (basicData.low52 || basicData.price * 0.8) * 1.1 ? 'LOW' : 'MID',
      },
      earnings: assetType === 'stock' ? {
        actual: Number((Math.random() * 5 + 1).toFixed(2)),
        estimate: Number((Math.random() * 4 + 2).toFixed(2)),
        surprise: Number((Math.random() * 1 - 0.5).toFixed(2)),
        date: new Date(Date.now() - Math.random() * 7776000000).toISOString().split('T')[0], // Random date within 3 months
      } : undefined,
      bid: basicData.price - Math.random() * 0.1,
      ask: basicData.price + Math.random() * 0.1,
      spread: Math.random() * 0.2,
    };

    return insights;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getProviderInfo(providerName: string): { name: string; isFree: boolean; rateLimit?: number } | null {
    const provider = this.providers.get(providerName);
    if (!provider) return null;

    return {
      name: provider.name,
      isFree: provider.isFree,
      rateLimit: provider.rateLimit,
    };
  }
}

// Singleton instance
export const marketDataService = new MarketDataService();

// Top markets configuration
export const TOP_MARKETS = {
  forex: ['EURUSD', 'GBPUSD', 'USDJPY'],
  futures: ['NQ', 'YM', 'ES'],
  commodities: ['GC=F', 'SI=F', 'CL=F'], // Gold, Silver, Crude Oil
  stocks: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'],
} as const;

export type MarketCategory = keyof typeof TOP_MARKETS;
