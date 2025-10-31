import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Play
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5">
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 text-cyan-400 border-cyan-400">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Trading Intelligence
            </Badge>

            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Trading Intelligence
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                {" "}Made Simple
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Discover trading opportunities, analyze markets, and track your favorite educators
              with AI-powered insights and real-time data.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-cyan-600 hover:bg-cyan-700">
                <Link href="/dashboard">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/market-analysis">
                  Stock Analysis
                  <BarChart3 className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need for Trading Success
            </h2>
            <p className="text-lg text-muted-foreground">
              Comprehensive tools for market analysis and trading education
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-background/50 border-white/10 hover:bg-background/70 transition-colors">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-cyan-400" />
                </div>
                <CardTitle>Stock Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Real-time stock data with comprehensive financial analysis, analyst ratings, and market insights.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/10 hover:bg-background/70 transition-colors">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle>Stream Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  AI-powered analysis of trading streams from top educators. Automatically track and analyze content.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/10 hover:bg-background/70 transition-colors">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle>Channel Discovery</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription>
                  Discover trending trading channels and educators. Build your personalized watchlist.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-cyan-500/5 to-blue-500/5">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to Transform Your Trading?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of traders using SAGE for better trading decisions.
            </p>

            <Button asChild size="lg" className="bg-cyan-600 hover:bg-cyan-700">
              <Link href="/dashboard">
                Start Your Journey
                <Play className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-background/50">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="relative">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
                <span className="text-xl font-light text-foreground dark:text-white tracking-tight">SAGE</span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/market-analysis" className="hover:text-foreground">
                Stock Analysis
              </Link>
              <Link href="/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/myapis" className="hover:text-foreground">
                APIs
              </Link>
              <Link href="/pricing" className="hover:text-foreground">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
