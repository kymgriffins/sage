import { NextRequest, NextResponse } from "next/server";
import { RateLimiter } from "@/lib/tiers";
import { marketDataService, AssetType } from "@/lib/market-data";



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const assetType = (searchParams.get("assetType") || "stock") as AssetType;
    const provider = searchParams.get("provider") || "yfinance";
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

    // Fetch market data using the new service
    const marketData = await marketDataService.fetchMarketData(symbol, assetType, provider);

    // Record the request for rate limiting
    await RateLimiter.recordRequest(userId, "market-data");

    return NextResponse.json({
      success: true,
      data: marketData,
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
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// New endpoint for batch market data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols, assetType = "stock", provider = "yfinance", userId = "anonymous" } = body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: "Symbols array is required" },
        { status: 400 }
      );
    }

    // Check rate limit for batch requests (higher cost)
    const rateLimitCheck = await RateLimiter.checkLimit(userId, "market-data-batch");
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded for batch requests",
          message: rateLimitCheck.message,
          retryAfter: rateLimitCheck.resetTime ? Math.ceil((rateLimitCheck.resetTime.getTime() - Date.now()) / 1000) : 3600
        },
        { status: 429 }
      );
    }

    // Fetch batch market data
    const marketData = await marketDataService.fetchBatchMarketData(symbols, assetType as AssetType, provider);

    // Record the request for rate limiting
    await RateLimiter.recordRequest(userId, "market-data-batch");

    return NextResponse.json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString(),
      rateLimit: {
        remaining: rateLimitCheck.remaining - 1,
        limit: rateLimitCheck.limit,
        resetTime: rateLimitCheck.resetTime,
      }
    });

  } catch (error) {
    console.error("Batch market data error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
