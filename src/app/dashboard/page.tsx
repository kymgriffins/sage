"use client";

import { useState, useEffect } from "react";
import { useAuth, useUserPermissions, useSubscription } from "@/lib/auth";
import { ChannelDiscovery } from "@/components/channel-discovery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  const { user } = useAuth();
  const permissions = useUserPermissions();
  const subscription = useSubscription();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - replace with real API calls
  const [trackedChannels, setTrackedChannels] = useState([
    {
      id: "1",
      youtubeChannelId: "UC123",
      title: "Trading Educators Academy",
      subscriberCount: "156000",
      lastAnalyzed: "2024-10-29T10:00:00Z",
      analysisCount: 12,
      favorite: true
    },
    {
      id: "2",
      youtubeChannelId: "UC456",
      title: "ICT Mentor",
      subscriberCount: "89200",
      lastAnalyzed: "2024-10-28T15:30:00Z",
      analysisCount: 8,
      favorite: false
    }
  ]);

  const [recentStreams, setRecentStreams] = useState([
    {
      id: "1",
      title: "Market Structure Breakdown - October 29",
      channelTitle: "Trading Educators Academy",
      status: "completed" as const,
      processingTime: "45s",
      insights: 7
    },
    {
      id: "2",
      title: "Live Session: Scalping Strategies",
      channelTitle: "ICT Mentor",
      status: "processing" as const,
      processingTime: null,
      insights: null
    }
  ]);

  const analytics = {
    totalStreams: 156,
    totalInsights: 1234,
    averageAccuracy: 94.2,
    favoriteChannels: 2
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Your SAGE Dashboard</h1>
              <p className="text-muted-foreground">
                Multi-channel trading intelligence dashboard
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-cyan-400">
                {subscription.tier.toUpperCase()} Plan
              </Badge>
              <Badge variant="outline">
                {permissions.analysisLimit - (permissions.analysisLimit - permissions.currentUsage)}/{permissions.analysisLimit} analyses
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="channels">My Channels</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Streams</h3>
                <div className="text-2xl font-bold text-foreground">{analytics.totalStreams}</div>
                <p className="text-xs text-green-400 mt-1">+12% this month</p>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Trading Insights</h3>
                <div className="text-2xl font-bold text-foreground">{analytics.totalInsights.toLocaleString()}</div>
                <p className="text-xs text-green-400 mt-1">+8% accuracy</p>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg Accuracy</h3>
                <div className="text-2xl font-bold text-foreground">{analytics.averageAccuracy}%</div>
                <p className="text-xs text-cyan-400 mt-1">Industry leading</p>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Tracked Channels</h3>
                <div className="text-2xl font-bold text-foreground">{analytics.favoriteChannels}</div>
                <p className="text-xs text-purple-400 mt-1">Add more →</p>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Stream Analyses</h3>
                <div className="space-y-3">
                  {recentStreams.map((stream) => (
                    <div key={stream.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {stream.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">{stream.channelTitle}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={stream.status === 'completed' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {stream.status === 'completed' ? '✓' : '⏳'} {stream.status}
                        </Badge>
                        {stream.processingTime && (
                          <span className="text-xs text-muted-foreground">{stream.processingTime}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {recentStreams.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No recent streams</p>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-lg font-semibold text-foreground mb-4">Tracked Channels</h3>
                <div className="space-y-3">
                  {trackedChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {channel.title}
                          </h4>
                          {channel.favorite && <span className="text-yellow-400">⭐</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(parseInt(channel.subscriberCount) / 1000).toFixed(0)}K subscribers • {channel.analysisCount} analyses
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full mt-4"
                  variant="outline"
                  onClick={() => setActiveTab("discover")}
                >
                  Discover More Channels
                </Button>
              </Card>
            </div>
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Your Tracked Channels</h2>
              <Button onClick={() => setActiveTab("discover")}>+ Add Channel</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trackedChannels.map((channel) => (
                <Card key={channel.id} className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{channel.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(parseInt(channel.subscriberCount) / 1000).toFixed(0)}K subscribers
                      </p>
                    </div>
                    {channel.favorite && <span className="text-yellow-400 text-xl">⭐</span>}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Last Analyzed</p>
                      <p className="text-sm text-foreground">
                        {new Date(channel.lastAnalyzed).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Analyses</p>
                      <p className="text-sm text-foreground">{channel.analysisCount}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">View Settings</Button>
                    <Button size="sm" variant="outline">View Analyses</Button>
                  </div>
                </Card>
              ))}
            </div>

            {trackedChannels.length === 0 && (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-foreground mb-2">No channels tracked yet</h3>
                <p className="text-muted-foreground mb-6">Start discovering trading educators to track their streams automatically.</p>
                <Button onClick={() => setActiveTab("discover")}>Discover Channels</Button>
              </div>
            )}
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Discover Trading Channels</h2>
                <p className="text-muted-foreground">
                  Find and track your favorite trading educators for automated stream analysis.
                </p>
              </div>
              <ChannelDiscovery />
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Advanced Analytics</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="font-semibold text-foreground mb-4">Performance by Channel</h3>
                {/* Placeholder for analytics chart */}
                <div className="space-y-3">
                  {trackedChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{channel.title}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{channel.analysisCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="font-semibold text-foreground mb-4">Analysis Trends</h3>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Track your trading insights over time
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
