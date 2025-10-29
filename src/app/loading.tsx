export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Loading content */}
      <div className="relative z-10 text-center">
        {/* SAGE logo with animated dots */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="text-4xl lg:text-6xl font-black text-foreground">
            <span className="text-cyan-400">S</span>AGE
          </div>
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>

        <div className="text-muted-foreground text-lg mb-4">
          Analyzing trading streams...
        </div>

        {/* Loading bar */}
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse"></div>
        </div>

        {/* Optional loading message */}
        <p className="text-sm text-muted-foreground mt-4 opacity-70">
          Setting up AI analysis engines...
        </p>
      </div>
    </div>
  )
}
