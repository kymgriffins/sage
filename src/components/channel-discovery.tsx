"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

interface YouTubeChannel {
  id: string;
  snippet: {
    channelId: string;
    title: string;
    description: string;
    customUrl?: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
    };
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
}

interface ChannelSearchResult extends YouTubeChannel {
  isSubscribed: boolean;
  isFavorite: boolean;
  relevanceScore: number;
}

export function ChannelDiscovery() {
  const { user, isSignedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChannelSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSubscriptions, setUserSubscriptions] = useState<Set<string>>(new Set());

  // Load user's subscribed channels
  useEffect(() => {
    if (user) {
      // TODO: Load from API/database
      loadUserSubscriptions();
    }
  }, [user]);

  const loadUserSubscriptions = async () => {
    try {
      // Mock data - replace with actual API call
      setUserSubscriptions(new Set(['UC123', 'UC456']));
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  };

  // Mock channel data - replace with YouTube API search
  const mockChannels: YouTubeChannel[] = [
    {
      id: 'UCqK_GSMbpiV8spMlbzpv8Bw', // Trading Educators
      snippet: {
        channelId: 'UCqK_GSMbpiV8spMlbzpv8Bw',
        title: 'Trading Educators Academy',
        description: 'Professional trading education with real strategies and market analysis.',
        thumbnails: {
          default: { url: '/api/placeholder/88/88' },
          medium: { url: '/api/placeholder/240/240' }
        }
      },
      statistics: {
        subscriberCount: '156000',
        videoCount: '245',
        viewCount: '23400000'
      }
    }
  ];

  const searchChannels = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      // TODO: Implement YouTube API search
      // const results = await searchYouTubeChannels(query);

      // Mock results for now
      const results = mockChannels
        .filter(channel =>
          channel.snippet.title.toLowerCase().includes(query.toLowerCase()) ||
          channel.snippet.description.toLowerCase().includes(query.toLowerCase())
        )
        .map(channel => ({
          ...channel,
          isSubscribed: userSubscriptions.has(channel.snippet.channelId),
          isFavorite: false, // TODO: Check favorites from API
          relevanceScore: 0.9 // TODO: Calculate based on trading relevance
        }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async (channelId: string) => {
    if (!user) return;

    try {
      // TODO: Implement actual API call
      if (userSubscriptions.has(channelId)) {
        // Unsubscribe
        setUserSubscriptions(prev => {
          const newSet = new Set(prev);
          newSet.delete(channelId);
          return newSet;
        });
        // await unsubscribeChannel(channelId);
      } else {
        // Subscribe
        setUserSubscriptions(prev => new Set(prev).add(channelId));
        // await subscribeChannel(channelId);
      }

      // Update search results
      setSearchResults(prev =>
        prev.map(result =>
          result.snippet.channelId === channelId
            ? { ...result, isSubscribed: !result.isSubscribed }
            : result
        )
      );
    } catch (error) {
      console.error('Subscription update failed:', error);
    }
  };

  const formatCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return count;
  };

  if (!isSignedIn) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-4">Sign in to discover trading channels</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Find and track your favorite trading educators to get automated analysis of their streams.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search trading educators (e.g., 'Peter Brandt', 'ICT', 'scalping strategies')"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && searchChannels(searchQuery)}
          className="flex-1"
        />
        <Button
          onClick={() => searchChannels(searchQuery)}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {searchResults.length === 0 && searchQuery && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            No trading channels found. Try different keywords or check spelling.
          </div>
        )}

        {searchResults.map((channel) => (
          <div key={channel.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <img
                src={channel.snippet.thumbnails.medium.url}
                alt={channel.snippet.title}
                className="w-16 h-16 rounded-xl"
              />

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {channel.snippet.title}
                </h3>

                <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                  {channel.snippet.description}
                </p>

                {/* Channel Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    👥 {formatCount(channel.statistics.subscriberCount)} subscribers
                  </span>
                  <span className="flex items-center gap-1">
                    🎬 {formatCount(channel.statistics.videoCount)} videos
                  </span>
                  <span className="flex items-center gap-1">
                    👁️ {formatCount(channel.statistics.viewCount)} views
                  </span>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    Trading Content
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Active Channel
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant={channel.isSubscribed ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleSubscription(channel.snippet.channelId)}
                >
                  {channel.isSubscribed ? '✓ Following' : '+ Follow'}
                </Button>

                {channel.isSubscribed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {/* TODO: Open tracking settings */}}
                  >
                    ⚙️ Settings
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Suggestions */}
      {!searchQuery && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Popular Trading Channels</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              "Peter Brandt",
              "ICT Mentor",
              "The Trading Channel",
              "Rayner Teo",
              "Wyckoff Trading"
            ].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery(suggestion);
                  searchChannels(suggestion);
                }}
                className="justify-start"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
