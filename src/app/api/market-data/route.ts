import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "@/lib/tiers";

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  high52: number;
  low52: number;
  pe: number;
  eps: number;
  dividend: number;
  yield: number;
  beta: number;
  analystRating: {
    rating: string;
    priceTarget: number;
  };
  news: {
    title: string;
    source: string;
    time: string;
    sentiment: "positive" | "negative" | "neutral";
  }[];
  weeklyRange: {
    current: number;
    high52: number;
    low52: number;
    position: string; // "HIGH" | "MID" | "LOW"
  };
  earnings: {
    actual: number;
    estimate: number;
    surprise: number;
    date: string;
  };
  bid: number;
  ask: number;
  spread: number;
}

// Mock data generator - using this to respect yfinance rate limits
function generateStockData(symbol: string): StockQuote {
  const basePrices: Record<string, number> = {
    "AAPL": 195.0,
    "GOOGL": 142.0,
    "MSFT": 415.0,
    "TSLA": 250.0,
    "NVDA": 875.0,
    "AMD": 125.0,
    "AMZN": 150.0,
    "META": 485.0,
  };

  const basePrice = basePrices[symbol] || 100.0;
  const change = (Math.random() - 0.5) * 4; // Random change between -2% and +2%
  const price = Math.max(basePrice + change, 0);
  const changePercent = (change / basePrice) * 100;

  // Generate weekly range data
  const high52 = basePrice * (1 + Math.random() * 0.5 + 0.1); // 10-60% above current
  const low52 = basePrice * (1 - Math.random() * 0.3 - 0.05); // 5-35% below current
  const position = price > high52 * 0.9 ? "HIGH" : price < low52 * 1.1 ? "LOW" : "MID";

  return {
    symbol: symbol.toUpperCase(),
    name: `${symbol.toUpperCase()} Corporation`,
    price: Number(price.toFixed(2)),
    change: Number(change.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    marketCap: Math.floor(basePrice * 10 + Math.random() * basePrice * 50) * 1000000000,
    volume: Math.floor(Math.random() * 50000000) + 10000000,
    avgVolume: Math.floor(Math.random() * 30000000) + 20000000,
    high52: Number(high52.toFixed(2)),
    low52: Number(low52.toFixed(2)),
    pe: Number((basePrice / (Math.random() * 5 + 5)).toFixed(2)),
    eps: Number((Math.random() * 8 + 2).toFixed(2)),
    dividend: Number((Math.random() * 2).toFixed(2)),
    yield: Number((Math.random() * 3 + 0.5).toFixed(2)),
    beta: Number((Math.random() * 1.5 + 0.7).toFixed(2)),
    analystRating: {
      rating: ["Strong Buy", "Buy", "Hold", "Sell"][Math.floor(Math.random() * 4)],
      priceTarget: Number((price * (1 + Math.random() * 0.4 - 0.1)).toFixed(2)),
    },
    news: Array.from({ length: 3 }, (_, i) => ({
      title: [
        `${symbol} Reports Q${Math.floor(Math.random() * 4) + 1} Earnings Beat`,
        `${symbol} Announces New Product Launch`,
        `Analysts Upgrade ${symbol} Rating to Buy`,
        `Market Update: ${symbol} Shows Strong Momentum`,
        `${symbol} Dividend Increase Expected`
      ][Math.floor(Math.random() * 5)],
      source: ["Bloomberg", "Reuters", "CNBC", "WSJ", "Financial Times"][Math.floor(Math.random() * 5)],
      time: `${Math.floor(Math.random() * 24)}h ago`,
      sentiment: (["positive", "negative", "neutral"] as const)[Math.floor(Math.random() * 3)],
    })),
    weeklyRange: {
      current: Number(price.toFixed(2)),
      high52: Number(high52.toFixed(2)),
      low52: Number(low52.toFixed(2)),
      position,
    },
    earnings: {
      actual: Number((Math.random() * 4 + 1).toFixed(2)),
      estimate: Number((Math.random() * 3 + 2).toFixed(2)),
      surprise: Number((Math.random() * 0.8 - 0.2).toFixed(2)),
      date: new Date(Date.now() - Math.random() * 600000000).toISOString().split('T')[0],
    },
    bid: Number((price - Math.random() * 0.05).toFixed(2)),
    ask: Number((price + Math.random() * 0.05).toFixed(2)),
    spread: Number((Math.random() * 0.1).toFixed(2)),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const userId = searchParams.get("userId") || "anonymous";

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol parameter is required" },
        { status: 400 }
      );
    }

    // Check rate limit for market data requests
    const rateLimitCheck = await RateLimiter.checkLimit(userId, "market-data");
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: rateLimitCheck.message,
          retryAfter: rateLimitCheck.resetTime ? Math.ceil((rateLimitCheck.resetTime.getTime() - Date.now()) / 1000) : 3600
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitCheck.retryAfter?.toString() || "3600",
            "X-RateLimit-Limit": rateLimitCheck.limit?.toString() || "10",
            "X-RateLimit-Remaining": rateLimitCheck.remaining?.toString() || "0",
            "X-RateLimit-Reset": rateLimitCheck.resetTime?.toISOString() || "",
          }
        }
      );
    }

    // Generate mock stock data (respecting real market constraints)
    const stockData = generateStockData(symbol);

    // Record the request for rate limiting
    await RateLimiter.recordRequest(userId, "market-data");

    return NextResponse.json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString(),
      rateLimit: {
        remaining: rateLimitCheck.remaining - 1, // Account for this request
        limit: rateLimitCheck.limit,
        resetTime: rateLimitCheck.resetTime,
      }
    });

  } catch (error) {
    console.error("Market data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
