"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MarketAnalysis } from "@/components/market-analysis";

export default function MarketAnalysisPage() {
  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <Badge variant="outline" className="text-cyan-400 border-cyan-400">
            BETA
          </Badge>
        </div>
        <h1 className="text-4xl font-black text-foreground dark:text-white mb-4">
          Stock Analysis
        </h1>
        <p className="text-xl text-muted-foreground dark:text-white/60 max-w-3xl">
          Real-time stock analysis with comprehensive financial data, analyst ratings,
          and institutional-grade insights for informed trading decisions.
        </p>
      </div>

      {/* Rate Limit Notice */}
      <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-700 dark:text-amber-400">Market Data Access</AlertTitle>
        <AlertDescription className="text-amber-600 dark:text-amber-300">
          Free tier: 5 stock analysis requests/hour. Upgrade to Pro for unlimited access and advanced analytics.
          <Button variant="link" className="p-0 h-auto text-amber-700 dark:text-amber-400 underline ml-2">
            Upgrade to Pro →
          </Button>
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <div className="space-y-6">
        <Card className="bg-background/50 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span>Advanced Stock Analysis</span>
            </CardTitle>
            <CardDescription>
              Comprehensive financial data with real-time market insights, analyst ratings,
              and institutional-grade analysis for informed trading decisions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MarketAnalysis />
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <Card className="bg-background/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Today's Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">3</div>
                <div className="text-sm text-muted-foreground">Stock Analyses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">12</div>
                <div className="text-sm text-muted-foreground">Data Requests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">5</div>
                <div className="text-sm text-muted-foreground">Hours Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pro Features Teaser */}
        <Card className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border-cyan-400/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                  Unlock Pro Features
                </h3>
                <p className="text-muted-foreground dark:text-white/60">
                  Get unlimited market data, advanced charting, custom alerts, and more.
                </p>
              </div>
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
