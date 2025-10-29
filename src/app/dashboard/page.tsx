export default function DashboardPage() {
  return (
    <div className="p-8 bg-background text-foreground min-h-screen">
      <h1 className="text-2xl font-bold text-primary mb-4">Your SAGE Dashboard</h1>
      <p className="text-muted-foreground mb-8">Manage your stream analyses and trading insights.</p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Recent Streams</h2>
          <p className="text-muted-foreground">No streams analyzed yet.</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Analytics Overview</h2>
          <p className="text-muted-foreground">No analytics available.</p>
        </div>
      </div>
    </div>
  );
}
