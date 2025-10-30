export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
          <span className="absolute top-0 left-0 w-3 h-3 bg-cyan-400 rounded-full"></span>
        </div>
        <span className="text-xl font-light text-foreground dark:text-white tracking-tight mt-4 block">
          Loading SAGE...
        </span>
      </div>
    </div>
  )
}
