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
  const [userSubscriptions, setUserSubscriptions] = useState<Set<string>>(new Set(['UC123', 'UC456']));

  // Mock channel data for UI development
  const mockChannels: YouTubeChannel[] = [
    {
      id: 'UCqK_GSMbpiV8spMlbzpv8Bw',
      snippet: {
        channelId: 'UCqK_GSMbpiV8spMlbzpv8Bw',
        title: 'Trading Educators Academy',
        description: 'Professional trading education with real strategies and market analysis. Daily live sessions and comprehensive courses.',
        thumbnails: {
          default: { url: 'https://via.placeholder.com/88x88/ccffcc/000000?text=TEA' },
          medium: { url: 'https://via.placeholder.com/240x240/ccffcc/000000?text=TEA' }
        }
      },
      statistics: {
        subscriberCount: '256000',
        videoCount: '342',
        viewCount: '34000000'
      }
    },
    {
      id: 'UCVeW9qkBjo3zosnqUbG7CFw',
      snippet: {
        channelId: 'UCVeW9qkBjo3zosnqUbG7CFw',
        title: 'The Trading Channel',
        description: 'Advanced trading strategies and market analysis. Live trading sessions and educational content for all skill levels.',
        thumbnails: {
          default: { url: 'https://via.placeholder.com/88x88/ffcccc/000000?text=TTC' },
          medium: { url: 'https://via.placeholder.com/240x240/ffcccc/000000?text=TTC' }
        }
      },
      statistics: {
        subscriberCount: '890000',
        videoCount: '1250',
        viewCount: '125000000'
      }
    },
    {
      id: 'UCI8X7tqLk-UZ0YNYI5qW8w',
      snippet: {
        channelId: 'UCI8X7tqLk-UZ0YNYI5qW8w',
        title: 'ICT Mentor',
        description: 'Cutting-edge inner circle trader concepts and methodologies. Master the markets with institutional trading approaches.',
        thumbnails: {
          default: { url: 'https://via.placeholder.com/88x88/ffccaa/000000?text=ICT' },
          medium: { url: 'https://via.placeholder.com/240x240/ffccaa/000000?text=ICT' }
        }
      },
      statistics: {
        subscriberCount: '456000',
        videoCount: '289',
        viewCount: '78800000'
      }
    }
  ];

  const searchChannels = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      // Call real YouTube API through our backend
      const response = await fetch(`/api/channels/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Search failed:', data.error);
        setSearchResults([]);
        return;
      }

      // Transform API response to match our component interface
      const results = data.data.map((channel: any) => ({
        id: channel.id,
        snippet: {
          channelId: channel.snippet.channelId,
          title: channel.snippet.title,
          description: channel.snippet.description,
          thumbnails: channel.snippet.thumbnails,
          customUrl: channel.snippet.customUrl
        },
        statistics: {
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount,
          viewCount: channel.statistics.viewCount
        },
        isSubscribed: userSubscriptions.has(channel.snippet.channelId),
        isFavorite: false,
        relevanceScore: channel.relevanceScore || 0,
        // Add additional fields that might be useful for UI
        searchMeta: {
          isPoweredByYouTube: data.meta.poweredByYouTube,
          totalResults: data.meta.totalResults
        }
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async (channelId: string) => {
    if (!user) return;

    // Simulate API call
    setUserSubscriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(channelId)) {
        newSet.delete(channelId);
      } else {
        newSet.add(channelId);
      }
      return newSet;
    });

    // Update search results
    setSearchResults(prev =>
      prev.map(result =>
        result.snippet.channelId === channelId
          ? { ...result, isSubscribed: !result.isSubscribed }
          : result
      )
    );
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
