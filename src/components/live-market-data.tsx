"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Euro,
  DollarSign,
  Activity,
  RefreshCw,
  Globe
} from "lucide-react";

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

export function LiveMarketData() {
  const [activeTab, setActiveTab] = useState("forex");
  const [marketData, setMarketData] = useState<LiveMarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [autoUpdate, setAutoUpdate] = useState(true);

  const fetchLiveData = async (isUpdate = false) => {
    try {
      const updateParam = isUpdate ? '&update=true' : '';
      const response = await fetch(`/api/market-data/live?userId=user123${updateParam}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch live market data');
      }

      setMarketData(data.data);
      setLastUpdate(new Date(data.data.lastUpdated).toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Live market data fetch error:', err);
    } finally {
      if (!isUpdate) {
        setLoading(false);
      }
    }
  };

  // Initial data load
  useEffect(() => {
    fetchLiveData();
  }, []);

  // Auto-refresh every 30 minutes (reduced to avoid rate limits)
  useEffect(() => {
    if (!autoUpdate) return;

    const interval = setInterval(() => {
      fetchLiveData(true);
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [autoUpdate]);

  const formatPrice = (price: number, decimals: number = 2) => `$${price.toFixed(decimals)}`;
  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toString();
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  const getChangeColor = (changePercent: number) => {
    return changePercent >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading && !marketData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !marketData) {
    return (
      <Card className="bg-background/50 border-white/10">
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <div className="text-lg font-semibold mb-2">Data Loading Error</div>
          <div className="text-muted-foreground mb-4">{error}</div>
          <Button onClick={() => fetchLiveData()} className="bg-cyan-500 hover:bg-cyan-600">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-green-400 border-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            LIVE
          </Badge>
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Last update: {lastUpdate}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoUpdate(!autoUpdate)}
            className={`${autoUpdate ? 'bg-green-500/10 border-green-500/50' : ''}`}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto {autoUpdate ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLiveData()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-background/50">
          <TabsTrigger value="forex" className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>Forex</span>
          </TabsTrigger>
          <TabsTrigger value="futures" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Futures</span>
          </TabsTrigger>
          <TabsTrigger value="commodities" className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Commodities</span>
          </TabsTrigger>
        </TabsList>

        {/* Forex Tab */}
        <TabsContent value="forex" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {marketData?.forex.map((item) => (
              <Card key={item.pair} className="bg-background/50 border-white/10 hover:bg-background/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{item.pair}</CardTitle>
                    <Badge variant="outline" className={`text-xs ${getTrendColor(item.trend)}`}>
                      {item.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {item.trend.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">{item.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-foreground dark:text-white">
                    {formatPrice(item.price, 4)}
                  </div>
                  <div className={`text-sm font-medium ${getChangeColor(item.changePercent)}`}>
                    {item.change >= 0 ? '+' : ''}{formatPrice(item.change, 4)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Spread</div>
                      <div className="font-semibold">{item.spread.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">24H Volume</div>
                      <div className="font-semibold">{formatVolume(item.volume24)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Futures Tab */}
        <TabsContent value="futures" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {marketData?.futures.map((item) => (
              <Card key={item.symbol} className="bg-background/50 border-white/10 hover:bg-background/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{item.symbol}</CardTitle>
                    <Badge variant="outline" className={`text-xs ${getTrendColor(item.trend)}`}>
                      {item.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {item.trend.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">{item.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-foreground dark:text-white">
                    {formatPrice(item.price)}
                  </div>
                  <div className={`text-sm font-medium ${getChangeColor(item.changePercent)}`}>
                    {item.change >= 0 ? '+' : ''}{formatPrice(item.change)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs">
                      <div className="text-muted-foreground">Contract Size</div>
                      <div className="font-semibold">{item.contractSize}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Open Interest</div>
                        <div className="font-semibold">{formatVolume(item.openInterest)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Volume</div>
                        <div className="font-semibold">{formatVolume(item.volume24)}</div>
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="text-muted-foreground">Expiration</div>
                      <div className="font-semibold">{item.expiration}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Commodities Tab */}
        <TabsContent value="commodities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {marketData?.commodities.map((item) => (
              <Card key={item.symbol} className="bg-background/50 border-white/10 hover:bg-background/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{item.symbol}</CardTitle>
                    <Badge variant="outline" className={`text-xs ${getTrendColor(item.trend)}`}>
                      {item.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {item.trend.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">{item.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-foreground dark:text-white">
                    {formatPrice(item.price, item.symbol === 'HGZ5' ? 4 : 2)}
                  </div>
                  <div className={`text-sm font-medium ${getChangeColor(item.changePercent)}`}>
                    {item.change >= 0 ? '+' : ''}{formatPrice(item.change, item.symbol === 'HGZ5' ? 4 : 2)} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Unit</div>
                      <div className="font-semibold">{item.unit}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">24H Volume</div>
                      <div className="font-semibold">{formatVolume(item.volume24)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-400">
              <div className="text-sm">⚠️ Data refresh error: {error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Status */}
      <Card className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border-cyan-400/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <div className="text-lg font-semibold">Market Status</div>
                <div className="text-sm text-muted-foreground">All live data streams active</div>
              </div>
            </div>
            <Badge variant="outline" className="text-green-400 border-green-400">
              Connected
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
