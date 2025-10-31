import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "@/lib/tiers";

interface ForexItem {
  pair: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  spread: number;
  trend: "up" | "down";
  volume24: number;
}

interface FuturesItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  contractSize: string;
  openInterest: number;
  volume24: number;
  expiration: string;
  trend: "up" | "down";
}

interface CommodityItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  volume24: number;
  trend: "up" | "down";
}

interface LiveMarketResponse {
  forex: ForexItem[];
  futures: FuturesItem[];
  commodities: CommodityItem[];
  timestamp: string;
  lastUpdated: string;
}

// Mock data generators
function generateForexData(): ForexItem[] {
  const items = [
    {
      pair: "EUR/USD",
      name: "Euro vs US Dollar",
      price: +(1.0847 + (Math.random() - 0.5) * 0.02),
      change: +(Math.random() - 0.5) * 0.001,
      changePercent: +(Math.random() - 0.5) * 0.1,
      spread: 0.0001,
      trend: Math.random() > 0.5 ? "up" as const : "down" as const,
      volume24: 157000000000
    },
    {
      pair: "USD/CHF",
      name: "US Dollar vs Swiss Franc",
      price: +(0.9056 + (Math.random() - 0.5) * 0.02),
      change: +(Math.random() - 0.5) * 0.001,
      changePercent: +(Math.random() - 0.5) * 0.1,
      spread: 0.0002,
      trend: Math.random() > 0.5 ? "up" as const : "down" as const,
      volume24: 99000000000
    },
    {
      pair: "GBP/USD",
      name: "British Pound vs US Dollar",
      price: +(1.3156 + (Math.random() - 0.5) * 0.02),
      change: +(Math.random() - 0.5) * 0.001,
      changePercent: +(Math.random() - 0.5) * 0.1,
      spread: 0.00015,
      trend: Math.random() > 0.5 ? "up" as const : "down" as const,
      volume24: 83000000000
    }
  ];

  return items.map(item => ({
    ...item,
    price: Number(item.price.toFixed(4)),
    change: Number(item.change.toFixed(4)),
    changePercent: Number(item.changePercent.toFixed(2))
  }));
}

function generateFuturesData(): FuturesItem[] {
  const items = [
    {
      symbol: "ESZ5",
      name: "E-mini S&P 500 Dec '25",
      price: +(5738.75 + (Math.random() - 0.5) * 20),
      change: +(Math.random() - 0.5) * 10,
      changePercent: +(Math.random() - 0.5) * 0.2,
      contractSize: "$50 per point",
      openInterest: 3200000,
      volume24: 1850000,
      expiration: "Dec 2025",
      trend: Math.random() > 0.5 ? "up" as const : "down" as const
    },
    {
      symbol: "NQZ5",
      name: "E-mini Nasdaq-100 Dec '25",
      price: +(20315.75 + (Math.random() - 0.5) * 50),
      change: +(Math.random() - 0.5) * 25,
      changePercent: +(Math.random() - 0.5) * 0.15,
      contractSize: "$20 per point",
      openInterest: 150000,
      volume24: 890000,
      expiration: "Dec 2025",
      trend: Math.random() > 0.5 ? "up" as const : "down" as const
    },
    {
      symbol: "CLZ5",
      name: "Crude Oil WTI Dec '25",
      price: +(68.45 + (Math.random() - 0.5) * 2),
      change: +(Math.random() - 0.5) * 1,
      changePercent: +(Math.random() - 0.5) * 1.5,
      contractSize: "1,000 barrels",
      openInterest: 245000,
      volume24: 1200000,
      expiration: "Dec 2025",
      trend: Math.random() > 0.5 ? "up" as const : "down" as const
    }
  ];

  return items.map(item => ({
    ...item,
    price: Number(item.price.toFixed(2)),
    change: Number(item.change.toFixed(2)),
    changePercent: Number(item.changePercent.toFixed(2))
  }));
}

function generateCommodityData(): CommodityItem[] {
  const items = [
    {
      symbol: "GCZ5",
      name: "Gold Dec '25",
      price: +(2156.80 + (Math.random() - 0.5) * 10),
      change: +(Math.random() - 0.5) * 5,
      changePercent: +(Math.random() - 0.5) * 0.3,
      unit: "$ per oz",
      volume24: 145000,
      trend: Math.random() > 0.5 ? "up" as const : "down" as const
    },
    {
      symbol: "SIZ5",
      name: "Silver Dec '25",
      price: +(24.67 + (Math.random() - 0.5) * 0.5),
      change: +(Math.random() - 0.5) * 0.25,
      changePercent: +(Math.random() - 0.5) * 1,
      unit: "$ per oz",
      volume24: 85000,
      trend: Math.random() > 0.5 ? "up" as const : "down" as const
    },
    {
      symbol: "HGZ5",
      name: "Copper Dec '25",
      price: +(4.2385 + (Math.random() - 0.5) * 0.1),
      change: +(Math.random() - 0.5) * 0.05,
      changePercent: +(Math.random() - 0.5) * 1.2,
      unit: "$ per lb",
      volume24: 67000,
      trend: Math.random() > 0.5 ? "up" as const : "down" as const
    }
  ];

  return items.map((item, index) => ({
    ...item,
    price: Number(item.price.toFixed(index === 2 ? 4 : 2)),
    change: Number(item.change.toFixed(index === 2 ? 4 : 2)),
    changePercent: Number(item.changePercent.toFixed(2))
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "anonymous";
    const update = searchParams.get("update") === "true";

    // Check rate limit for live data requests
    const rateLimitCheck = await RateLimiter.checkLimit(userId, "live-data");
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
            "X-RateLimit-Limit": rateLimitCheck.limit?.toString() || "20",
            "X-RateLimit-Remaining": rateLimitCheck.remaining?.toString() || "0",
            "X-RateLimit-Reset": rateLimitCheck.resetTime?.toISOString() || "",
          }
        }
      );
    }

    let responseData: LiveMarketResponse;

    if (update) {
      // Lightweight update - just generate new prices for existing data structure
      responseData = {
        forex: generateForexData(),
        futures: generateFuturesData(),
        commodities: generateCommodityData(),
        timestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Full response with all market data
      responseData = {
        forex: generateForexData(),
        futures: generateFuturesData(),
        commodities: generateCommodityData(),
        timestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    }

    // Record the request for rate limiting
    await RateLimiter.recordRequest(userId, "live-data");

    return NextResponse.json({
      success: true,
      data: responseData,
      rateLimit: {
        remaining: rateLimitCheck.remaining - 1,
        limit: rateLimitCheck.limit,
        resetTime: rateLimitCheck.resetTime,
      },
      isUpdate: update
    });

  } catch (error) {
    console.error("Live market data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
