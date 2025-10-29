import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Animated gradient orb background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/20 dark:bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Glowing grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 container mx-auto px-6">
        {/* Minimal nav */}
        <nav className="py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
              <span className="text-xl font-light text-foreground dark:text-white tracking-tight">SAGE</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/demo" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Demo
              </Link>
              <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Pricing →
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Hero */}
        <div className="py-32 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 backdrop-blur-sm mb-8">
            <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse" />
            <span className="text-sm text-foreground dark:text-white/60">AI-POWERED TRADING INTELLIGENCE</span>
          </div>

          <h1 className="text-7xl lg:text-9xl font-black tracking-tight mb-8">
            <span className="bg-gradient-to-r from-foreground dark:from-white via-cyan-400 to-foreground dark:to-white bg-clip-text text-transparent">
              SAGE
            </span>
          </h1>

          <p className="text-2xl lg:text-4xl text-muted-foreground dark:text-white/40 mb-12 max-w-3xl mx-auto leading-tight">
            AI that <span className="text-foreground dark:text-white">understands</span> trading streams.
            Extracts Trading<span className="text-foreground dark:text-white"> insights </span>. Finds <span className="text-foreground dark:text-white">edge</span>.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Link
              href="/analyze"
              className="group relative px-8 py-4 bg-primary text-primary-foreground dark:bg-white dark:text-black rounded-lg font-medium text-lg hover:bg-cyan-100 transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-lg opacity-0 group-hover:opacity-100 blur transition-opacity duration-300 -z-10" />
              Start Analysis
            </Link>

            <Link
              href="/demo"
              className="px-8 py-4 border border-white/20 dark:border-white/20 text-foreground dark:text-white rounded-lg font-medium text-lg hover:bg-white/5 dark:hover:bg-white/5 transition-all duration-300"
            >
              Watch Demo
            </Link>
          </div>

          {/* Live Metrics */}
          <div className="inline-flex items-center space-x-8 text-muted-foreground dark:text-white/40 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>1.2K Streams Analyzed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span>94% Accuracy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span>Real-time Processing</span>
            </div>
          </div>
        </div>

        {/* Live Preview Section */}
        <div className="py-20">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden">
              {/* Window Controls */}
              <div className="flex items-center space-x-4 p-6 border-b border-white/10 dark:border-white/10">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <div className="text-muted-foreground dark:text-white/40 text-sm font-mono">sage-analysis-terminal</div>
              </div>

              {/* Code Preview */}
              <div className="p-8 font-mono text-sm">
                <div className="text-cyan-400">const analysis = await sage.analyzeStream(videoURL)</div>
                <div className="text-purple-400 ml-4">{`// → Processing stream...`}</div>
                <div className="text-green-400 ml-4">{`// ✓ Transcript extracted (98% accuracy)`}</div>
                <div className="text-green-400 ml-4">{`// ✓ 8 trades detected`}</div>
                <div className="text-green-400 ml-4">{`// ✓ Strategy patterns identified`}</div>
                <br />
                {/* <div className="text-purple-400">analysis.trades</div>
                <div className="text-foreground dark:text-white ml-4">{`[`}</div>
                <div className="text-foreground dark:text-white ml-8">{`{ timestamp: `}<span className="text-amber-400">"00:12:34"</span>, signal: <span className="text-green-400">"BUY"</span>, confidence: <span className="text-cyan-400">0.94</span> },</div>
                <div className="text-foreground dark:text-white ml-8">{`{ timestamp: `}<span className="text-amber-400">"00:28:15"</span>, signal: <span className="text-red-400">"SELL"</span>, confidence: <span className="text-cyan-400">0.87</span> },</div>
                <div className="text-foreground dark:text-white ml-8">{`{ timestamp: `}<span className="text-amber-400">"00:45:02"</span>, signal: <span className="text-green-400">"BUY"</span>, confidence: <span className="text-cyan-400">0.96</span> }</div>
                <div className="text-foreground dark:text-white ml-4">{`]`}</div> */}
                <br />
                <div className="text-purple-400">analysis.performance</div>
                <div className="text-foreground dark:text-white ml-4">{`{`}</div>
                <div className="text-foreground dark:text-white ml-8">winRate: <span className="text-cyan-400">0.75</span>,</div>
                <div className="text-foreground dark:text-white ml-8">avgWin: <span className="text-green-400">"+2.4%"</span>,</div>
                <div className="text-foreground dark:text-white ml-8">strategy: <span className="text-amber-400">"Breakout Momentum"</span></div>
                <div className="text-foreground dark:text-white ml-4">{`}`}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="py-20">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                title: "Real-time Analysis",
                desc: "Process streams as they happen",
                color: "cyan"
              },
              {
                title: "Trade Detection",
                desc: "AI identifies every trade with timestamps",
                color: "purple"
              },
              {
                title: "Strategy Insights",
                desc: "Understand the why behind every move",
                color: "blue"
              }
            ].map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white/5 dark:bg-white/5 border border-white/10 dark:border-white/10 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 dark:hover:bg-white/10 transition-all duration-300">
                  <div className={`w-8 h-8 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`w-3 h-3 bg-${feature.color}-400 rounded-full animate-pulse`} />
                  </div>
                  <h3 className="text-foreground dark:text-white text-lg font-medium mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground dark:text-white/40 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-black text-foreground dark:text-white mb-8">
              Ready to <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Analyze</span>?
            </h2>
            <p className="text-muted-foreground dark:text-white/40 text-lg mb-8">
              Join traders who are already extracting alpha from every stream.
            </p>
            <Link
              href="/analyze"
              className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground dark:bg-white dark:text-black rounded-lg font-medium text-lg hover:bg-cyan-100 transition-all duration-300 hover:scale-105"
            >
              Start Free Analysis
              <div className="w-2 h-2 bg-black rounded-full ml-3 animate-pulse" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 border-t border-white/10 dark:border-white/10">
          <div className="flex items-center justify-between text-muted-foreground dark:text-white/40 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
              <span>SAGE AI • 2024</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="hover:text-foreground dark:hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground dark:hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-foreground dark:hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
