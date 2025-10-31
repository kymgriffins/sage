export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
        <span className="text-foreground dark:text-white">Loading SAGE...</span>
      </div>
    </div>
  );
}
