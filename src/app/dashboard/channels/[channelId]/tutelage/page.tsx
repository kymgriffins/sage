"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, ExternalLink } from "lucide-react";

interface VideoItem {
  id: string;
  youtubeId: string;
  youtubeUrl: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  channelId: string;
  category: string;
  isLive: boolean;
  thumbnailUrl: string;
  daysSincePublished: number | null;
}

interface ChannelInfo {
  title: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

const VideoCard = ({ video }: { video: VideoItem }) => (
  <Card className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
    <div className="flex items-start gap-4">
      {/* Video Thumbnail */}
      <div className="relative flex-shrink-0">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-32 h-24 object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-black/20 rounded-lg pointer-events-none" />
        <button className="absolute inset-0 flex items-center justify-center group">
          <div className="w-8 h-8 bg-black/75 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-4 h-4 text-white ml-0.5" />
          </div>
        </button>
        {video.isLive && (
          <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
            LIVE
          </Badge>
        )}
      </div>

      {/* Video Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <h4 className="font-semibold text-foreground line-clamp-2 hover:text-blue-400 cursor-pointer">
          {video.title}
        </h4>

        {video.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {video.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            📅 {new Date(video.publishedAt).toLocaleDateString()}
          </span>
          {video.daysSincePublished !== null && video.daysSincePublished < 7 && (
            <Badge variant="secondary" className="text-xs">
              Last {video.daysSincePublished} days
            </Badge>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank')}
          className="flex items-center gap-2"
        >
          <ExternalLink className="w-3 h-3" />
          Watch
        </Button>
      </div>
    </div>
  </Card>
);

export default function ChannelTutelagePage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.channelId as string;

  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<{
    liveStreams: VideoItem[];
    tradeReviews: VideoItem[];
    weeklyOutlooks: VideoItem[];
    weeklyForecasts: VideoItem[];
  }>({
    liveStreams: [],
    tradeReviews: [],
    weeklyOutlooks: [],
    weeklyForecasts: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (channelId) {
      fetchChannelTutelage();
    }
  }, [channelId]);

  const fetchChannelTutelage = async () => {
    console.log(`🎯 === TUTELAGE PAGE: FETCHING DATA ===`);
    console.log(`🔗 Channel ID: ${channelId}`);
    console.log(`🌐 URLs to fetch:`);
    console.log(`   - Channels: /api/user/channels?stats=true`);
    console.log(`   - Videos: /api/channels/videos?channelId=${channelId}&limit=25`);

    setLoading(true);
    try {
      // Fetch channel info
      console.log(`📡 Fetching channel info...`);
      const channelResponse = await fetch('/api/user/channels?stats=true');
      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        console.log(`✅ Channel info received:`);
        console.log(`   - Status: ${channelResponse.status}`);
        console.log(`   - Total subscriptions: ${channelData.data?.subscriptions?.length || 0}`);

        const channel = channelData.data.subscriptions.find((ch: any) => ch.youtubeChannelId === channelId);
        if (channel) {
          console.log(`🎯 Found matching channel: ${channel.title} (${channel.youtubeChannelId})`);
          setChannelInfo({
            title: channel.title,
            thumbnail: channel.thumbnail,
            subscriberCount: parseInt(channel.subscribers) || 0,
            videoCount: parseInt(channel.videoCount) || 0,
            viewCount: parseInt(channel.viewCount) || 0,
          });
        } else {
          console.log(`❌ No matching channel found in subscriptions`);
        }
      } else {
        console.log(`❌ Channel info fetch failed: ${channelResponse.status}`);
      }

      // Fetch videos for this channel
      console.log(`🎬 Fetching videos for channel ${channelId}...`);
      const videosResponse = await fetch(`/api/channels/videos?channelId=${channelId}&limit=25`);
      console.log(`📡 Videos response status: ${videosResponse.status}`);

      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        console.log(`✅ Videos data received:`);
        console.log(`   - Success: ${videosData.success}`);
        console.log(`   - Total videos: ${videosData.data?.summary?.totalVideos || 0}`);
        console.log(`   - Categories:`, Object.keys(videosData.data?.categories || {}));

        if (videosData.data?.categories) {
          setVideos(videosData.data.categories);
          console.log(`📊 Category breakdown:`);
          Object.entries(videosData.data.categories).forEach(([cat, videos]: [string, any]) => {
            console.log(`   - ${cat}: ${videos.length} videos`);
          });
        }
      } else {
        console.log(`❌ Videos fetch failed: ${videosResponse.status}`);
      }
    } catch (error) {
      console.error('💥 Error fetching channel tutelage:', error);
    } finally {
      console.log(`🏁 === TUTELAGE PAGE: FETCH COMPLETED ===`);
      setLoading(false);
    }
  };

  const videoCategories = [
    {
      key: 'overview',
      title: 'Overview',
      description: `All educational content from ${channelInfo?.title || 'this channel'}`,
      count: Object.values(videos).flat().length,
      icon: '📚'
    },
    {
      key: 'liveStreams',
      title: 'Live Streams',
      description: 'Real-time trading sessions and market analysis',
      count: videos.liveStreams.length,
      icon: '🔴'
    },
    {
      key: 'tradeReviews',
      title: 'Trade Reviews',
      description: 'Market reviews, trade breakdowns, and strategy analysis',
      count: videos.tradeReviews.length,
      icon: '📊'
    },
    {
      key: 'weeklyOutlooks',
      title: 'Weekly Outlooks',
      description: 'Broader market perspectives and trend analysis',
      count: videos.weeklyOutlooks.length,
      icon: '📈'
    },
    {
      key: 'weeklyForecasts',
      title: 'Weekly Forecasts',
      description: 'Specific market predictions for the coming week',
      count: videos.weeklyForecasts.length,
      icon: '🎯'
    }
  ];

  const getCurrentVideos = () => {
    if (activeTab === 'overview') {
      return Object.values(videos).flat().sort((a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    }
    return videos[activeTab as keyof typeof videos] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading channel tutelage...</p>
        </div>
      </div>
    );
  }

  if (!channelInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Channel not found or not accessible</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-4">
              {channelInfo.thumbnail && (
                <img
                  src={channelInfo.thumbnail}
                  alt={channelInfo.title}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{channelInfo.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>👥 {(channelInfo.subscriberCount / 1000).toFixed(0)}K subscribers</span>
                  <span>🎬 {channelInfo.videoCount} videos</span>
                  <span>👁️ {(channelInfo.viewCount / 1000000).toFixed(1)}M views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            {videoCategories.map((category) => (
              <TabsTrigger
                key={category.key}
                value={category.key}
                className="flex items-center gap-2"
              >
                <span>{category.icon}</span>
                <span className="hidden sm:inline">{category.title}</span>
                <Badge variant="secondary" className="ml-1">
                  {category.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {videoCategories.map((category) => (
            <TabsContent key={category.key} value={category.key} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{category.title}</h2>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {category.count} {category.count === 1 ? 'video' : 'videos'}
                </Badge>
              </div>

              {category.key === 'overview' ? (
                <div className="space-y-4">
                  {typeof window !== 'undefined' && getCurrentVideos().map((video) => (
                    <VideoCard key={`${video.category}-${video.id}`} video={video} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {videos[category.key as keyof typeof videos]?.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}

              {!getCurrentVideos().length && (
                <Card className="p-8 text-center bg-white/5 border-white/10">
                  <div className="space-y-2">
                    <span className="text-4xl">{category.icon}</span>
                    <h3 className="text-lg font-medium text-foreground">
                      No {category.title.toLowerCase()} found
                    </h3>
                    <p className="text-muted-foreground">
                      This channel hasn't published any {category.title.toLowerCase()} yet.
                    </p>
                  </div>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
