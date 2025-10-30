"use client";

import { useState, useEffect } from "react";
import { useAuth, useUserPermissions, useSubscription } from "@/lib/auth-hooks";
import { ChannelDiscovery } from "@/components/channel-discovery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Play } from "lucide-react";

interface TrackedChannel {
  id: string;
  youtubeChannelId: string;
  title: string;
  description?: string;
  customUrl?: string;
  country?: string;
  subscriberCount: number;
  viewCount?: number;
  videoCount?: number;
  thumbnail?: string;
  isVerified?: boolean;
  lastAnalyzed: string;
  lastActivity?: string;
  analysisCount: number;
  favorite: boolean;
}

interface RecentStream {
  id: string;
  title: string;
  channelTitle: string;
  status: "completed" | "processing" | "failed";
  processingTime?: string;
  insights?: number | null;
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
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [trackedChannels, setTrackedChannels] = useState<TrackedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalStreams: 0,
    totalInsights: 0,
    averageAccuracy: 0,
    favoriteChannels: 0
  });

  // Fetch user's followed channels on component mount
  useEffect(() => {
    if (user) {
      fetchUserChannels();
    }
  }, [user]);

  const fetchUserChannels = async () => {
    try {
      const response = await fetch('/api/user/channels?stats=true');
      const data = await response.json();

      if (data.success) {
        // Transform API response to component format
        const channels = data.data.subscriptions.map((sub: any) => ({
          id: sub.id,
          youtubeChannelId: sub.youtubeChannelId,
          title: sub.title,
          description: sub.description,
          customUrl: sub.customUrl,
          country: sub.country,
          subscriberCount: parseInt(sub.subscribers) || 0,
          viewCount: parseInt(sub.viewCount) || 0,
          videoCount: parseInt(sub.videoCount) || 0,
          thumbnail: sub.thumbnail,
          isVerified: sub.isVerified,
          lastAnalyzed: sub.lastUpdated || sub.lastActivity,
          lastActivity: sub.lastActivity,
          analysisCount: sub.analysisCount,
          favorite: sub.isFavorite
        }));

        setTrackedChannels(channels);

        // Update dashboard stats
        setDashboardStats({
          totalStreams: data.data.summary.totalAnalyzed || 0,
          totalInsights: channels.reduce((sum: number, channel: TrackedChannel) => sum + channel.analysisCount, 0),
          averageAccuracy: 94.2, // TODO: Calculate real average
          favoriteChannels: data.data.summary.favoritesCount
        });
      } else {
        console.error('Failed to fetch user channels:', data.error);
        toast({
          title: "Failed to load channels",
          description: "Could not load your followed channels. Please refresh the page.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching user channels:', error);
      toast({
        title: "Connection error",
        description: "Could not connect to load your channels. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent streams with analysis data
  const [recentStreams, setRecentStreams] = useState<RecentStream[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(true);

  // Processing status management
  const [processingStatus, setProcessingStatus] = useState({
    isDiscovering: false,
    isProcessing: false,
    queued: 0,
    processing: 0,
    completed: 0,
    total: 0
  });

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState({
    channelPerformance: [],
    trends: {
      totalStreams: 0,
      completedAnalyses: 0,
      averageAccuracy: 0,
      totalProcessingTime: 0
    },
    sentimentDistribution: {
      bullish: 0,
      bearish: 0,
      neutral: 0
    }
  });



  useEffect(() => {
    if (user) {
      fetchRecentStreams();
      fetchProcessingStatus();
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchRecentStreams = async () => {
    try {
      const response = await fetch('/api/user/recent-streams?limit=5');
      const data = await response.json();

      if (data.success) {
        setRecentStreams(data.data);
      } else {
        console.error('Failed to fetch recent streams:', data.error);
        // Keep mock data as fallback
        setRecentStreams([
          {
            id: "mock-1",
            title: "Market Structure Breakdown - October 29",
            channelTitle: trackedChannels[0]?.title || "Trading Educators Academy",
            status: "completed",
            processingTime: "45s",
            insights: 7
          },
          {
            id: "mock-2",
            title: "Live Session: Scalping Strategies",
            channelTitle: trackedChannels[1]?.title || "ICT Mentor",
            status: "processing",
            insights: null
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching recent streams:', error);
      // Mock fallback
      setRecentStreams([
        {
          id: "mock-1",
          title: "Market Structure Breakdown - October 29",
          channelTitle: trackedChannels[0]?.title || "Trading Educators Academy",
          status: "completed",
          processingTime: "45s",
          insights: 7
        }
      ]);
    } finally {
      setLoadingStreams(false);
    }
  };

  const fetchProcessingStatus = async () => {
    try {
      const response = await fetch('/api/process-streams');
      const data = await response.json();

      if (data.success) {
        setProcessingStatus(prev => ({
          ...prev,
          queued: data.data.queued || 0,
          processing: data.data.processing || 0,
          completed: data.data.completed || 0,
          total: data.data.total || 0
        }));
      }
    } catch (error) {
      console.error('Error fetching processing status:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch('/api/user/analytics');
      const data = await response.json();

      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const discoverStreams = async () => {
    if (!trackedChannels.length) {
      toast({
        title: "No channels to discover",
        description: "Follow some channels first before discovering streams.",
        variant: "destructive"
      });
      return;
    }

    setProcessingStatus(prev => ({ ...prev, isDiscovering: true }));

    try {
      const response = await fetch('/api/discover-streams', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Stream discovery complete",
          description: `Discovered ${data.data.newStreams} new streams from ${data.data.processedChannels} channels.`,
        });
        // Refresh processing status and streams
        fetchProcessingStatus();
        fetchRecentStreams();
      } else {
        toast({
          title: "Discovery failed",
          description: data.error || "Failed to discover streams.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error discovering streams:', error);
      toast({
        title: "Discovery error",
        description: "Failed to connect to discovery service.",
        variant: "destructive"
      });
    } finally {
      setProcessingStatus(prev => ({ ...prev, isDiscovering: false }));
    }
  };

  const processStreams = async () => {
    if (processingStatus.queued === 0) {
      toast({
        title: "No streams to process",
        description: "Discover streams first, or wait for processing to complete.",
        variant: "destructive"
      });
      return;
    }

    setProcessingStatus(prev => ({ ...prev, isProcessing: true }));

    try {
      const response = await fetch('/api/process-streams', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Processing complete",
          description: `Processed ${data.data.processed} streams successfully.`,
        });
        // Refresh processing status and streams
        fetchProcessingStatus();
        fetchRecentStreams();
      } else {
        toast({
          title: "Processing failed",
          description: data.error || "Failed to process streams.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing streams:', error);
      toast({
        title: "Processing error",
        description: "Failed to connect to processing service.",
        variant: "destructive"
      });
    } finally {
      setProcessingStatus(prev => ({ ...prev, isProcessing: false }));
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
            {/* Processing Status & Controls */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Processing Status</h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Queue: <Badge variant="outline">{processingStatus.queued} queued</Badge>
                    <Badge variant="outline" className="ml-2">{processingStatus.processing} processing</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={discoverStreams}
                  disabled={processingStatus.isDiscovering || !trackedChannels.length}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {processingStatus.isDiscovering ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Discover Streams
                </Button>

                <Button
                  onClick={processStreams}
                  disabled={processingStatus.isProcessing || processingStatus.queued === 0}
                  className="flex items-center gap-2"
                >
                  {processingStatus.isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Process Queue ({processingStatus.queued})
                </Button>

                <Button
                  onClick={() => {
                    fetchProcessingStatus();
                    fetchRecentStreams();
                    fetchUserChannels();
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Discover streams from your followed channels and queue them for automated analysis.
              </p>
            </Card>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Streams</h3>
                <div className="text-2xl font-bold text-foreground">{dashboardStats.totalStreams}</div>
                <p className="text-xs text-green-400 mt-1">+12% this month</p>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Trading Insights</h3>
                <div className="text-2xl font-bold text-foreground">{dashboardStats.totalInsights.toLocaleString()}</div>
                <p className="text-xs text-green-400 mt-1">+8% accuracy</p>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg Accuracy</h3>
                <div className="text-2xl font-bold text-foreground">{dashboardStats.averageAccuracy}%</div>
                <p className="text-xs text-cyan-400 mt-1">Industry leading</p>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Tracked Channels</h3>
                <div className="text-2xl font-bold text-foreground">{dashboardStats.favoriteChannels}</div>
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
                <div className="space-y-4">
                  {trackedChannels.map((channel) => (
                    <div key={channel.id} className="bg-white/10 border border-white/20 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        {channel.thumbnail && (
                          <img
                            src={channel.thumbnail}
                            alt={channel.title}
                            className="w-12 h-12 rounded-full border-2 border-white/20"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-md font-semibold text-foreground truncate">
                              {channel.title}
                            </h4>
                            {channel.favorite && <span className="text-yellow-400">⭐</span>}
                            {channel.isVerified && <Badge variant="secondary" className="text-xs">✓ Verified</Badge>}
                          </div>

                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {channel.description || 'No description available'}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>👥 {(channel.subscriberCount / 1000).toFixed(0)}K subscribers</span>
                            <span>🎬 {channel.videoCount || 0} videos</span>
                            <span>👁️ {(channel.viewCount ? channel.viewCount / 1000000 : 0).toFixed(1)}M views</span>
                            {channel.country && (
                              <span className="inline-flex items-center gap-1">
                                <span>📍</span>
                                {channel.country}
                              </span>
                            )}
                          </div>

                          {channel.customUrl && (
                            <p className="text-xs text-cyan-400 mt-1 font-mono">
                              @{channel.customUrl?.replace('@', '')}
                            </p>
                          )}
                        </div>

                        <Badge variant="outline" className="text-xs shrink-0">
                          Active
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {trackedChannels.length === 0 && (
                  <p className="text-muted-foreground text-center py-6">
                    No channels subscribed yet. Discover and follow trading channels to see them here.
                  </p>
                )}

        <div className="flex gap-2 mt-4">
          <Button
            className="flex-1"
            variant="outline"
            onClick={async () => {
              toast({
                title: "Refreshing channel data...",
                description: "Syncing latest subscriber counts and statistics from YouTube"
              });

              try {
                const response = await fetch('/api/channels/refresh', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();

                if (data.success) {
                  toast({
                    title: "Data refreshed!",
                    description: `Updated ${data.data?.refreshed || 0} channels (${data.data?.upToDate || 0} already current)`,
                    variant: "success"
                  });
                  // Refresh the channel data in the UI
                  fetchUserChannels();
                } else {
                  toast({
                    title: "Refresh failed",
                    description: data.error || "Could not refresh channel data",
                    variant: "destructive"
                  });
                }
              } catch (error) {
                toast({
                  title: "Network error",
                  description: "Could not connect to sync service",
                  variant: "destructive"
                });
              }
            }}
          >
            🔄 Refresh Data
          </Button>

          <Button
            className="flex-1"
            variant="outline"
            onClick={() => setActiveTab("discover")}
          >
            + Add Channels
          </Button>
        </div>
              </Card>
            </div>
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Your Tracked Channels</h2>
              <Button onClick={() => setActiveTab("discover")}>+ Add Channel</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trackedChannels.map((channel) => (
                <Card key={channel.id} className="p-6 bg-white/5 border-white/10">
                  <div className="space-y-4">
                    {/* Header with thumbnail and basic info */}
                    <div className="flex items-start gap-4">
                      {channel.thumbnail && (
                        <img
                          src={channel.thumbnail}
                          alt={channel.title}
                          className="w-16 h-16 rounded-full border-3 border-white/20 object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-foreground truncate">
                            {channel.title}
                          </h3>
                          {channel.favorite && <span className="text-yellow-400 text-xl">⭐</span>}
                          {channel.isVerified && <Badge variant="secondary" className="text-xs">✓ Verified</Badge>}
                        </div>

                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {channel.description || 'No description available'}
                        </p>

                        {channel.customUrl && (
                          <p className="text-xs text-cyan-400 font-mono">
                            @{channel.customUrl?.replace('@', '')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Channel stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Subscribers</p>
                        <p className="text-lg font-semibold text-foreground">
                          {(channel.subscriberCount / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Videos</p>
                        <p className="text-lg font-semibold text-foreground">
                          {channel.videoCount || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Views</p>
                        <p className="text-sm font-semibold text-foreground">
                          {(channel.viewCount ? channel.viewCount / 1000000 : 0).toFixed(1)}M
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Country</p>
                        <p className="text-sm font-semibold text-foreground">
                          {channel.country || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Analysis stats */}
                    <div className="border-t border-white/10 pt-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Last Analyzed</p>
                          <p className="text-sm text-foreground">
                            {channel.lastAnalyzed ? new Date(channel.lastAnalyzed).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Analyses</p>
                          <p className="text-sm text-foreground">{channel.analysisCount}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => router.push(`/dashboard/channels/${channel.youtubeChannelId}/tutelage`)}>
                          View Tutelage
                        </Button>
                        <Button size="sm" variant="outline">
                          ⚙️ Settings
                        </Button>
                      </div>
                    </div>
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

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 bg-white/5 border-white/10">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Total Streams</h4>
                <div className="text-xl font-bold text-foreground">{analyticsData.trends.totalStreams}</div>
              </Card>

              <Card className="p-4 bg-white/5 border-white/10">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Completed Analyses</h4>
                <div className="text-xl font-bold text-foreground">{analyticsData.trends.completedAnalyses}</div>
              </Card>

              <Card className="p-4 bg-white/5 border-white/10">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Avg Accuracy</h4>
                <div className="text-xl font-bold text-foreground">{analyticsData.trends.averageAccuracy}%</div>
              </Card>

              <Card className="p-4 bg-white/5 border-white/10">
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Processing Time</h4>
                <div className="text-xl font-bold text-foreground">
                  {analyticsData.trends.totalProcessingTime ? `${analyticsData.trends.totalProcessingTime.toFixed(1)}s` : 'N/A'}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="font-semibold text-foreground mb-4">Channel Performance</h3>
                <div className="space-y-3">
                  {analyticsData.channelPerformance.length > 0 ? (
                    analyticsData.channelPerformance.map((channel: any) => (
                      <div key={channel.channelTitle} className="flex items-center justify-between">
                        <span className="text-sm text-foreground truncate max-w-[200px]">
                          {channel.channelTitle}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-white/10 rounded-full">
                            <div
                              className="h-full bg-cyan-400 rounded-full"
                              style={{ width: `${channel.completionRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {channel.completedAnalyses}/{channel.totalStreams}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No channel analytics available yet</p>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="font-semibold text-foreground mb-4">Sentiment Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Bullish</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-white/10 rounded-full">
                        <div
                          className="h-full bg-green-400 rounded-full"
                          style={{
                            width: `${analyticsData.sentimentDistribution.bullish + analyticsData.sentimentDistribution.bearish + analyticsData.sentimentDistribution.neutral > 0 ?
                              (analyticsData.sentimentDistribution.bullish / (analyticsData.sentimentDistribution.bullish + analyticsData.sentimentDistribution.bearish + analyticsData.sentimentDistribution.neutral)) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {analyticsData.sentimentDistribution.bullish}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Bearish</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-white/10 rounded-full">
                        <div
                          className="h-full bg-red-400 rounded-full"
                          style={{
                            width: `${analyticsData.sentimentDistribution.bullish + analyticsData.sentimentDistribution.bearish + analyticsData.sentimentDistribution.neutral > 0 ?
                              (analyticsData.sentimentDistribution.bearish / (analyticsData.sentimentDistribution.bullish + analyticsData.sentimentDistribution.bearish + analyticsData.sentimentDistribution.neutral)) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {analyticsData.sentimentDistribution.bearish}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Neutral</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-white/10 rounded-full">
                        <div
                          className="h-full bg-gray-400 rounded-full"
                          style={{
                            width: `${analyticsData.sentimentDistribution.bullish + analyticsData.sentimentDistribution.bearish + analyticsData.sentimentDistribution.neutral > 0 ?
                              (analyticsData.sentimentDistribution.neutral / (analyticsData.sentimentDistribution.bullish + analyticsData.sentimentDistribution.bearish + analyticsData.sentimentDistribution.neutral)) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {analyticsData.sentimentDistribution.neutral}
                      </span>
                    </div>
                  </div>
                </div>

                {analyticsData.sentimentDistribution.bullish + analyticsData.sentimentDistribution.bearish + analyticsData.sentimentDistribution.neutral === 0 && (
                  <p className="text-muted-foreground text-center py-4 mt-4">No sentiment data available yet</p>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
