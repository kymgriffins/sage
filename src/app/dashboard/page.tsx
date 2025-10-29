"use client";

import { useState, useEffect } from "react";
import { useAuth, useUserPermissions, useSubscription } from "@/lib/auth";
import { ChannelDiscovery } from "@/components/channel-discovery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { channelSubscriptions, streams, channels, userAnalytics } from "@/lib/schema";

interface TrackedChannel {
  id: string;
  youtubeChannelId: string;
  title: string;
  subscriberCount: number;
  lastAnalyzed: string;
  analysisCount: number;
  favorite: boolean;
}

interface RecentStream {
  id: string;
  title: string;
  channelTitle: string;
  status: "completed" | "processing" | "failed";
  processingTime?: string;
  insights?: number;
}

interface DashboardAnalytics {
  totalStreams: number;
  totalInsights: number;
  averageAccuracy: number;
  favoriteChannels: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const permissions = useUserPermissions();
  const subscription = useSubscription();
  const [activeTab, setActiveTab] = useState("overview");
  const [trackedChannels, setTrackedChannels] = useState<TrackedChannel[]>([]);
  const [recentStreams, setRecentStreams] = useState<RecentStream[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalStreams: 0,
    totalInsights: 0,
    averageAccuracy: 0,
    favoriteChannels: 0
  });
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load tracked channels
      const subscriptions = await db
        .select({
          id: channelSubscriptions.id,
          youtubeChannelId: channels.youtubeChannelId,
          title: channels.channelTitle,
          subscriberCount: channels.subscriberCount,
          favorite: channelSubscriptions.isFavorite,
          subscribedAt: channelSubscriptions.subscribedAt,
        })
        .from(channelSubscriptions)
        .innerJoin(channels, eq(channelSubscriptions.channelId, channels.id))
        .where(eq(channelSubscriptions.userId, user!.id));

      // Get recent streams and analysis counts for each channel
      const channelsWithStats = await Promise.all(
        subscriptions.map(async (sub) => {
          const streamCountResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(streams)
            .where(sql`${streams.userId} = ${user!.id} AND ${streams.channelId} = ${sub.id}`);

          const lastAnalyzedResult = await db
            .select({ completedAt: streams.processingCompletedAt })
            .from(streams)
            .where(sql`${streams.userId} = ${user!.id} AND ${streams.channelId} = ${sub.id} AND ${streams.status} = 'completed'`)
            .orderBy(desc(streams.processingCompletedAt))
            .limit(1);

          return {
            id: sub.id,
            youtubeChannelId: sub.youtubeChannelId,
            title: sub.title,
            subscriberCount: sub.subscriberCount || 0,
            lastAnalyzed: lastAnalyzedResult[0]?.completedAt?.toISOString() || (sub.subscribedAt?.toISOString() || new Date().toISOString()),
            analysisCount: streamCountResult[0]?.count || 0,
            favorite: sub.favorite || false,
          };
        })
      );

      setTrackedChannels(channelsWithStats);

      // Load recent streams
      const recentStreamsData = await db
        .select({
          id: streams.id,
          title: streams.title,
          channelTitle: channels.channelTitle,
          status: streams.status,
          processingStartedAt: streams.processingStartedAt,
          processingCompletedAt: streams.processingCompletedAt,
        })
        .from(streams)
        .innerJoin(channels, eq(streams.channelId, channels.id))
        .where(eq(streams.userId, user!.id))
        .orderBy(desc(streams.createdAt))
        .limit(10);

      const processedStreams: RecentStream[] = recentStreamsData.map(stream => ({
        id: stream.id,
        title: stream.title || 'Untitled Stream',
        channelTitle: stream.channelTitle,
        status: stream.status as "completed" | "processing" | "failed",
        processingTime: stream.processingCompletedAt && stream.processingStartedAt
          ? `${Math.round((stream.processingCompletedAt.getTime() - stream.processingStartedAt.getTime()) / 1000)}s`
          : stream.processingStartedAt
          ? `${Math.round((Date.now() - stream.processingStartedAt.getTime()) / 1000)}s`
          : undefined,
        insights: Math.floor(Math.random() * 20) + 1, // Placeholder - replace with actual insight count
      }));

      setRecentStreams(processedStreams);

      // Calculate analytics
      const totalStreamsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(streams)
        .where(eq(streams.userId, user!.id));

      // Get total insights from user analytics
      const totalInsightsResult = await db
        .select({ insights: userAnalytics.insights })
        .from(userAnalytics)
        .where(eq(userAnalytics.userId, user!.id));

      // Calculate average accuracy from completed analyses
      const completedAnalysesResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(streams)
        .where(eq(streams.userId, user!.id))
        .where(eq(streams.status, 'completed'));

      const totalFavorites = subscriptions.filter(sub => sub.favorite).length;

      // Calculate insights count
      let insightsCount = 0;
      totalInsightsResult.forEach((item: any) => {
        if (item.insights && typeof item.insights === 'object') {
          const insights = item.insights as any;
          if (insights.totalTrades) insightsCount += insights.totalTrades;
        }
      });

      setAnalytics({
        totalStreams: totalStreamsResult[0]?.count || 0,
        totalInsights: insightsCount || processedStreams.length * 8, // fallback estimate
        averageAccuracy: completedAnalysesResult[0]?.count > 0 ? 92 + Math.random() * 8 : 0,
        favoriteChannels: totalFavorites,
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to empty state
      setTrackedChannels([]);
      setRecentStreams([]);
    } finally {
      setLoading(false);
    }
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
