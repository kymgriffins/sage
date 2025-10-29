import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Play, BarChart3, Zap, Clock, Settings, Download, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Brain className="h-8 w-8 text-cyan-400" />
                <Sparkles className="h-3 w-3 text-cyan-300 absolute -top-1 -right-1" />
              </div>
              <span className="text-2xl font-bold text-white">SAGE</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                <Download className="h-4 w-4 mr-2" />
                Mobile App
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-16 lg:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="px-4 py-2 bg-cyan-500/10 text-cyan-300 border-cyan-500/20 mb-6">
              AI Smart Agent • Project Management
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6">
              Trading Stream
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Analyser
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Manage Projects and Build Your Ultimate AI Agent — Workforce
            </p>

            {/* CTA Section */}
            <div className="space-y-4">
              <div>
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-12 py-6 text-lg">
                  <Zap className="h-5 w-5 mr-2" />
                  Get Started — It's True
                </Button>
              </div>
              <div>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  <Download className="h-4 w-4 mr-2" />
                  Download — Mobile App
                </Button>
              </div>
            </div>
          </div>

          {/* Analytics Dashboard Preview */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Column - Scripted Section */}
            <div className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-cyan-300 flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Scripted
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <span className="text-slate-300">Advanced</span>
                      <Badge variant="outline" className="text-cyan-300 border-cyan-500/30">
                        All Time, Time, Range...Set
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <span className="text-slate-300">Eclipse</span>
                      <Badge variant="outline" className="text-blue-300 border-blue-500/30">
                        Add Time, Time, Range...Set
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stream Controls */}
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Play className="h-5 w-5 mr-2" />
                    Live Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <span className="text-slate-300">Current Stream</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        Active
                      </Badge>
                    </div>
                    <Button className="w-full bg-cyan-500/10 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/20">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Insights
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Disk/Integration Section */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Disk & Integrations
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Connected platforms and data sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Integration Items */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: 'Rakuten', color: 'bg-red-500/20', text: 'text-red-300' },
                      { name: 'NCR', color: 'bg-blue-500/20', text: 'text-blue-300' },
                      { name: 'monday', color: 'bg-orange-500/20', text: 'text-orange-300' },
                      { name: 'YouTube', color: 'bg-red-500/20', text: 'text-red-300' },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${item.color} border-opacity-30 backdrop-blur-sm`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className={`font-medium ${item.text}`}>{item.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stats Overview */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-cyan-300">1.2K</div>
                      <div className="text-sm text-slate-400">Streams Analyzed</div>
                    </div>
                    <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-300">95%</div>
                      <div className="text-sm text-slate-400">Accuracy Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/20 backdrop-blur-sm">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Ready to Analyze Your Trading Streams?
                </h3>
                <p className="text-slate-300 mb-6">
                  Join professional traders using SAGE for intelligent stream analysis
                </p>
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  <Zap className="h-5 w-5 mr-2" />
                  Start Free Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}