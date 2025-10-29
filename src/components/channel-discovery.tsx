"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

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
      high: { url: string };
    };
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
  searchMeta?: {
    isPoweredByYouTube: boolean;
    totalResults: number;
    mode: string;
  };
}

interface ChannelSearchResult extends YouTubeChannel {
  isSubscribed: boolean;
  isFavorite: boolean;
  relevanceScore: number;
}

export function ChannelDiscovery() {
  const { user, isSignedIn } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChannelSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSubscriptions, setUserSubscriptions] = useState<Set<string>>(new Set(['UC123', 'UC456']));
  const [searchMode, setSearchMode] = useState<'auto' | 'mock' | 'api'>('auto');

  const searchChannels = async (query: string) => {
    if (!query.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a search term to find trading channels",
        variant: "warning"
      });
      return;
    }

    if (query.trim().length < 2) {
      toast({
        title: "Search too short",
        description: "Please enter at least 2 characters for search",
        variant: "warning"
      });
      return;
    }

    setLoading(true);

    toast({
      title: "Searching...",
      description: `Looking for trading channels matching "${query}"`,
      variant: "info"
    });

    try {
      // Determine mode parameter based on search mode
      let modeParam = '';
      if (searchMode === 'mock') {
        modeParam = '&mode=mock';
      } else if (searchMode === 'api') {
        modeParam = '&mode=api';
      }

      const response = await fetch(`/api/channels/search?q=${encodeURIComponent(query)}${modeParam}`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Search failed:', data.error);

        if (data.details && data.details.includes('YouTube API key')) {
          toast({
            title: "YouTube API not configured",
            description: "Configure YOUTUBE_API_KEY in your environment variables or switch to Mock mode",
            variant: "destructive"
          });
        } else if (data.error === 'Search query is required') {
          toast({
            title: "Search query required",
            description: "Please enter a search term",
            variant: "warning"
          });
        } else {
          toast({
            title: "Search failed",
            description: data.error || "Unable to search channels. Please try again.",
            variant: "destructive"
          });
        }

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
        relevanceScore: channel.relevanceScore || 50,
        searchMeta: {
          isPoweredByYouTube: data.meta.poweredByYouTube,
          totalResults: data.meta.totalResults,
          mode: data.meta.mode
        }
      }));

      setSearchResults(results);

      // Success notification with mode info
      if (results.length > 0) {
        const modeInfo: Record<string, string> = {
          'mock': 'demo data',
          'api': 'YouTube API',
          'auto': data.meta.poweredByYouTube ? 'YouTube API' : 'demo data',
          'auto_mock_fallback': 'demo data (auto fallback)',
          'error_fallback': 'demo data (error fallback)'
        };

        const modeText = modeInfo[data.meta.mode] || 'search';

        toast({
          title: "Search successful!",
          description: `Found ${results.length} channel${results.length === 1 ? '' : 's'} using ${modeText}`,
          variant: "success"
        });
      } else {
        toast({
          title: "No results found",
          description: `Try different keywords or search for popular traders like "Peter Brandt" or "ICT Mentor"`,
          variant: "warning"
        });
      }

    } catch (error) {
      console.error('Search error:', error);

      toast({
        title: "Network error",
        description: "Unable to connect to search service. Please check your internet connection.",
        variant: "destructive"
      });

      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async (channelId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "You must be signed in to follow channels",
        variant: "warning"
      });
      return;
    }

    const currentlySubscribed = userSubscriptions.has(channelId);
    const channelName = searchResults.find(ch => ch.snippet.channelId === channelId)?.snippet.title || 'Unknown Channel';

    try {
      toast({
        title: currentlySubscribed ? "Unfollowing..." : "Following...",
        description: `${currentlySubscribed ? 'Removing' : 'Adding'} ${channelName}`,
        variant: "info"
      });

      // Use real API for subscription management
      const method = currentlySubscribed ? 'DELETE' : 'POST';
      const url = `/api/channels/subscribe${currentlySubscribed ? `?channelId=${encodeURIComponent(channelId)}` : ''}`;

      const body = currentlySubscribed ? undefined : JSON.stringify({ channelId });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Subscription API error:', data);

        // Handle specific error types
        if (response.status === 409) {
          toast({
            title: "Already subscribed",
            description: `You are already following "${channelName}"`,
            variant: "warning"
          });
          return;
        }

        if (response.status === 404) {
          toast({
            title: "Channel not found",
            description: "This channel may no longer exist or you may not be subscribed",
            variant: "destructive"
          });
          return;
        }

        throw new Error(data.error || 'Subscription request failed');
      }

      // Update local state on success
      setUserSubscriptions(prev => {
        const newSet = new Set(prev);
        if (currentlySubscribed) {
          newSet.delete(channelId);
        } else {
          newSet.add(channelId);
        }
        return newSet;
      });

      // Update search results UI
      setSearchResults(prev =>
        prev.map(result =>
          result.snippet.channelId === channelId
            ? { ...result, isSubscribed: !currentlySubscribed }
            : result
        )
      );

      toast({
        title: currentlySubscribed ? "Channel unfollowed" : "Channel followed!",
        description: `${channelName} ${currentlySubscribed ? 'removed from' : 'added to'} your tracked channels`,
        variant: "success"
      });

    } catch (error) {
      console.error('Subscription error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      toast({
        title: "Subscription failed",
        description: `Unable to ${currentlySubscribed ? 'unfollow' : 'follow'} ${channelName}. Please check your connection and try again.`,
        variant: "destructive"
      });
    }
  };

  const handleSearchModeChange = (newMode: 'auto' | 'mock' | 'api') => {
    setSearchMode(newMode);

    const modeDescriptions = {
      auto: "Automatically uses YouTube API if available, falls back to mock data",
      mock: "Always uses demo/mock data without calling YouTube API",
      api: "Forces use of YouTube API (will fail if not configured)"
    };

    toast({
      title: "Search mode changed",
      description: modeDescriptions[newMode],
      variant: "info"
    });

    setSearchResults([]);
    setSearchQuery("");
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
      {/* Search Mode Toggle */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Search Mode</h4>
          <div className="flex items-center gap-4">
            {/* Auto Mode */}
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="auto-mode"
                name="search-mode"
                checked={searchMode === 'auto'}
                onChange={() => handleSearchModeChange('auto')}
                className="w-4 h-4"
              />
              <label htmlFor="auto-mode" className="text-sm font-medium">
                Auto
                <span className="text-muted-foreground text-xs ml-1">(API if available)</span>
              </label>
            </div>

            {/* Mock Mode */}
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="mock-mode"
                name="search-mode"
                checked={searchMode === 'mock'}
                onChange={() => handleSearchModeChange('mock')}
                className="w-4 h-4"
              />
              <label htmlFor="mock-mode" className="text-sm font-medium">
                Demo/Mock
                <span className="text-muted-foreground text-xs ml-1">(No API)</span>
              </label>
            </div>

            {/* API Mode */}
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="api-mode"
                name="search-mode"
                checked={searchMode === 'api'}
                onChange={() => handleSearchModeChange('api')}
                className="w-4 h-4"
              />
              <label htmlFor="api-mode" className="text-sm font-medium">
                YouTube API
                <span className="text-muted-foreground text-xs ml-1">(Force API)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {searchMode === 'auto' && 'Automatically uses YouTube API if configured, falls back to mock data'}
          {searchMode === 'mock' && 'Always uses demo/mock data without calling YouTube API'}
          {searchMode === 'api' && 'Forces use of YouTube API (will fail if not configured)'}
        </div>
      </div>

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
          {loading ? 'Searching...' : 'Search'} {searchMode === 'mock' ? '(Demo)' : searchMode === 'api' ? '(API)' : '(Auto)'}
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
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {channel.snippet.title}
                  </h3>
                  {channel.searchMeta && !channel.searchMeta.isPoweredByYouTube && (
                    <Badge variant="secondary" className="text-xs">
                      Demo Data
                    </Badge>
                  )}
                </div>

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
                    onClick={() => {/* TODO: Open tracking settings */ }}
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
              "Tanja Trades",
              "Tyler Trades",
              "Fx4Living",
              "Lord of Merchants",
              "Charmaine ICT Trading",
              "ICT Inner Circle Trader",
              "Smart Money Concepts"
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
