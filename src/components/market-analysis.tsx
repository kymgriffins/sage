"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, TrendingDown, Search, BarChart3, Calendar, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StockData {
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
    position: string;
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

export function MarketAnalysis() {
  const [symbol, setSymbol] = useState("AAPL");
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const fetchStockData = async (ticker: string) => {
    if (!ticker.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/market-data?symbol=${ticker}&userId=user123`);
      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting specially
        if (response.status === 429 && data.error?.includes('Rate limit exceeded')) {
          setRateLimited(true);
          const retryAfter = data.retryAfter || 3600; // Default to 1 hour
          setRetryAfter(retryAfter);

          // Auto-re-enable after rate limit period
          setTimeout(() => {
            setRateLimited(false);
            setRetryAfter(null);
          }, retryAfter * 1000);

          throw new Error(`Market data requests exceeded (5/hour limit). Upgrade to Pro for unlimited access or try again in ${Math.floor(retryAfter / 60)} minutes.`);
        }
        throw new Error(data.error || 'Failed to fetch stock data');
      }

      setStockData(data.data);
      setLastUpdate(new Date().toLocaleTimeString());
      setRateLimited(false);
      setRetryAfter(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Market data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStockData(symbol);
  };

  // Auto-load AAPL on mount
  useEffect(() => {
    fetchStockData("AAPL");
  }, []);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toString();
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="bg-background/50 border-white/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Stock Analysis</span>
          </CardTitle>
          <CardDescription>
            Enter a stock symbol to get comprehensive market data, analyst ratings, and financial insights.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter stock symbol (e.g., AAPL, GOOGL, TSLA)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="bg-background/50 border-white/20"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || rateLimited}
              className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600"
            >
              <Search className="w-4 h-4 mr-2" />
              {rateLimited
                ? `Retry in ${retryAfter ? Math.floor(retryAfter / 60) : 0}min`
                : "Analyze"
              }
            </Button>
          </form>

          {lastUpdate && (
            <div className="mt-2 text-sm text-muted-foreground">
              Last updated: {lastUpdate}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-700 dark:text-red-400">Analysis Error</AlertTitle>
          <AlertDescription className="text-red-600 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Stock Data Display */}
      {stockData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price & Key Metrics */}
          <Card className="bg-background/50 border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{stockData.symbol}</CardTitle>
                  <CardDescription className="text-lg">{stockData.name}</CardDescription>
                </div>
                <Badge variant={stockData.change >= 0 ? "default" : "destructive"}>
                  {stockData.change >= 0 ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold text-foreground dark:text-white">
                {formatPrice(stockData.price)}
              </div>
              <div className={`text-sm ${stockData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stockData.change >= 0 ? '+' : ''}{formatPrice(stockData.change)} ({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div>
                  <div className="text-sm text-muted-foreground">Market Cap</div>
                  <div className="text-lg font-semibold">{formatLargeNumber(stockData.marketCap)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">P/E Ratio</div>
                  <div className="text-lg font-semibold">{stockData.pe.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Volume</div>
                  <div className="text-lg font-semibold">{formatVolume(stockData.volume)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Avg Volume</div>
                  <div className="text-lg font-semibold">{formatVolume(stockData.avgVolume)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 52-Week Range & Analysis */}
          <Card className="bg-background/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span>52-Week Range Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Low</span>
                <span className="font-semibold">{formatPrice(stockData.low52)}</span>
              </div>

              <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div
                  className="absolute h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                  style={{
                    left: `${((stockData.low52 - stockData.low52) / (stockData.high52 - stockData.low52)) * 100}%`,
                    right: `${((stockData.high52 - stockData.price) / (stockData.high52 - stockData.low52)) * 100}%`,
                  }}
                />
                <div
                  className="absolute w-1 h-5 bg-cyan-400 rounded-full transform -translate-x-1/2"
                  style={{
                    left: `${((stockData.price - stockData.low52) / (stockData.high52 - stockData.low52)) * 100}%`,
                    top: '-6px',
                  }}
                />
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">High</span>
                <span className="font-semibold">{formatPrice(stockData.high52)}</span>
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-center">
                  <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                    Position: {stockData.weeklyRange.position}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analyst Ratings & Target */}
          <Card className="bg-background/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                <span>Analyst Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-foreground dark:text-white">
                  {stockData.analystRating.rating}
                </div>
                <Badge variant="outline" className="text-green-400 border-green-400">
                  Price Target: {formatPrice(stockData.analystRating.priceTarget)}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">EPS</div>
                  <div className="text-lg font-semibold">${stockData.eps.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Beta</div>
                  <div className="text-lg font-semibold">{stockData.beta.toFixed(2)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Dividend Yield</div>
                  <div className="text-lg font-semibold">{stockData.yield.toFixed(2)}%</div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="text-sm text-muted-foreground mb-2">Recent Earnings</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Actual</div>
                    <div className="font-semibold">${stockData.earnings.actual.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Estimate</div>
                    <div className="font-semibold">${stockData.earnings.estimate.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <Badge variant={stockData.earnings.surprise >= 0 ? "default" : "destructive"} className="text-xs">
                    Surprise: {stockData.earnings.surprise >= 0 ? '+' : ''}${stockData.earnings.surprise.toFixed(2)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latest News */}
          <Card className="bg-background/50 border-white/10">
            <CardHeader>
              <CardTitle>Market News & Updates</CardTitle>
              <CardDescription>Latest headlines and analyst commentary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stockData.news.map((newsItem, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getSentimentColor(newsItem.sentiment)}`}>
                    <div className="font-medium text-sm mb-1">{newsItem.title}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{newsItem.source}</span>
                      <span className="text-muted-foreground">{newsItem.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="bg-background/50 border-white/10">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
