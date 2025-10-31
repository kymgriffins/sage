"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, TrendingUp, TrendingDown, RefreshCw, DollarSign, BarChart3, Activity } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderSelector } from "@/components/provider-selector";
import { TOP_MARKETS, MarketCategory, AssetType, MarketData } from "@/lib/market-data-client";

interface MarketInsightsProps {
  className?: string;
}

export function MarketInsights({ className }: MarketInsightsProps) {
  const [marketData, setMarketData] = useState<Record<string, MarketData[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentProvider, setCurrentProvider] = useState('yfinance');

  const categories: { key: MarketCategory; label: string; assetType: AssetType }[] = [
    { key: 'forex', label: 'Forex', assetType: 'forex' },
    { key: 'futures', label: 'Futures', assetType: 'futures' },
    { key: 'commodities', label: 'Commodities', assetType: 'commodity' },
    { key: 'stocks', label: 'Stocks', assetType: 'stock' },
  ];

  const fetchMarketData = async (category: MarketCategory, assetType: AssetType) => {
    setLoading(prev => ({ ...prev, [category]: true }));
    setError(null);

    try {
      const symbols = [...TOP_MARKETS[category]]; // Convert readonly array to mutable

      // Use batch API endpoint
      const response = await fetch('/api/market-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols,
          assetType,
          provider: currentProvider,
          userId: 'user123', // In production, get from auth context
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch market data');
      }

      setMarketData(prev => ({ ...prev, [category]: result.data }));
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      console.error('Market data fetch error:', err);
    } finally {
      setLoading(prev => ({ ...prev, [category]: false }));
    }
  };

  const refreshAllMarkets = async () => {
    setError(null);
    const promises = categories.map(({ key, assetType }) =>
      fetchMarketData(key, assetType)
    );
    await Promise.allSettled(promises);
  };

  // Auto-load all markets on mount
  useEffect(() => {
    refreshAllMarkets();
  }, []);

  const formatPrice = (price: number, assetType: AssetType) => {
    if (assetType === 'forex') {
      return price.toFixed(4);
    }
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getCategoryIcon = (category: MarketCategory) => {
    switch (category) {
      case 'forex': return <DollarSign className="w-4 h-4" />;
      case 'futures': return <BarChart3 className="w-4 h-4" />;
      case 'commodities': return <Activity className="w-4 h-4" />;
      case 'stocks': return <TrendingUp className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground dark:text-white">
            Market Insights
          </h2>
          <p className="text-muted-foreground dark:text-white/60">
            Real-time data for top markets across all categories
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <div className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          <Button
            onClick={refreshAllMarkets}
            disabled={Object.values(loading).some(Boolean)}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="mb-6 border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-700 dark:text-red-400">Market Data Error</AlertTitle>
          <AlertDescription className="text-red-600 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Provider Selector */}
      <div className="mb-6">
        <ProviderSelector
          currentProvider={currentProvider}
          onProviderChange={setCurrentProvider}
        />
      </div>

      <Tabs defaultValue="forex" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map(({ key, label }) => (
            <TabsTrigger key={key} value={key} className="flex items-center space-x-2">
              {getCategoryIcon(key)}
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(({ key, label, assetType }) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <Card className="bg-background/50 border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getCategoryIcon(key)}
                  <span>Top {label} Markets</span>
                  <Badge variant="outline" className="ml-auto">
                    {TOP_MARKETS[key].length} Markets
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Real-time prices and performance for the most traded {label.toLowerCase()} instruments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading[key] ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border border-white/10 rounded-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : marketData[key]?.length > 0 ? (
                  <div className="space-y-3">
                    {marketData[key].map((market) => (
                      <div
                        key={market.symbol}
                        className="flex items-center justify-between p-4 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-foreground dark:text-white">
                            {market.symbol}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {market.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground dark:text-white">
                            {formatPrice(market.price, assetType)}
                          </div>
                          <div className={`text-sm font-medium ${getChangeColor(market.change)}`}>
                            {formatChange(market.change, market.changePercent)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No market data available</p>
                    <Button
                      onClick={() => fetchMarketData(key, assetType)}
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Market Summary */}
      <Card className="mt-6 bg-background/50 border-white/10">
        <CardHeader>
          <CardTitle className="text-lg">Market Summary</CardTitle>
          <CardDescription>Quick overview of market performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(({ key, label }) => {
              const data = marketData[key] || [];
              const positiveCount = data.filter(m => m.change >= 0).length;
              const totalCount = data.length;

              return (
                <div key={key} className="text-center">
                  <div className="text-2xl font-bold text-foreground dark:text-white">
                    {positiveCount}/{totalCount}
                  </div>
                  <div className="text-sm text-muted-foreground">{label}</div>
                  <div className="text-xs text-green-600">
                    {totalCount > 0 ? `${Math.round((positiveCount / totalCount) * 100)}%` : '0%'} positive
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
