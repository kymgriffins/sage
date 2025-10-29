export default function Pricing() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary text-center mb-8">Choose Your SAGE Tier</h1>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Free</h2>
            <p className="text-destructive mb-4">$0/month</p>
            <ul className="text-muted-foreground mb-6">
              <li>3 streams per month</li>
              <li>Basic analysis</li>
              <li>Community streams</li>
              <li>10 req/hour</li>
            </ul>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Pro</h2>
            <p className="text-destructive mb-4">$29/month</p>
            <ul className="text-muted-foreground mb-6">
              <li>50 streams per month</li>
              <li>Advanced analysis</li>
              <li>Export data</li>
              <li>Priority processing</li>
              <li>100 req/hour</li>
            </ul>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Enterprise</h2>
            <p className="text-destructive mb-4">Custom pricing</p>
            <ul className="text-muted-foreground mb-6">
              <li>Unlimited streams</li>
              <li>White label</li>
              <li>API access</li>
              <li>Dedicated support</li>
              <li>1000 req/hour</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
