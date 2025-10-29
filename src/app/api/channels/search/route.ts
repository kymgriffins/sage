// YouTube Channel Search API
// GET /api/channels/search?q=searchQuery

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';

// YouTube API Response Types
interface YouTubeSearchResult {
  kind: string;
  etag: string;
  id: {
    kind: string;
    channelId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
    };
    channelTitle: string;
    liveBroadcastContent: string;
    publishTime: string;
  };
}

interface YouTubeChannelDetails {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    localized: {
      title: string;
      description: string;
    };
    country: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
  brandingSettings?: {
    channel: {
      title: string;
      description: string;
      keywords: string;
      defaultTab: string;
      moderateComments: boolean;
      showRelatedChannels: boolean;
    };
  };
}

interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchResult[];
}

interface YouTubeChannelsResponse {
  kind: string;
  etag: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeChannelDetails[];
}

// Calculate trading relevance score
function calculateRelevanceScore(channel: YouTubeChannelDetails, searchQuery: string): number {
  let score = 0;
  const query = searchQuery.toLowerCase();
  const title = channel.snippet.title.toLowerCase();
  const description = channel.snippet.description.toLowerCase();
  const keywords = channel.brandingSettings?.channel?.keywords?.toLowerCase() || '';

  // Exact match in title = highest score
  if (title.includes(query)) {
    score += 40;
    if (title.startsWith(query)) score += 30; // Starts with query
  }

  // Keyword matches
  if (keywords.includes(query)) score += 35;

  // Description relevance
  if (description.includes(query)) score += 20;

  // Trading-related terms boost
  const tradingTerms = ['trading', 'forex', 'crypto', 'stocks', 'analysis', 'strategy', 'technical', 'trade'];
  const tradingkeywords = ['trading', 'forex', 'fx', 'currency', 'crypto', 'cryptocurrency', 'bitcoin', 'btc', 'stocks', 'equities', 'analysis', 'technical analysis', 'trading strategies', 'market analysis', 'price action'];

  let tradingTermCount = 0;
  tradingTerms.forEach(term => {
    if (query.includes(term) && (title.includes(term) || keywords.includes(term) || description.includes(term))) {
      tradingTermCount++;
    }
  });

  tradingkeywords.forEach(keyword => {
    if (keywords.includes(keyword) || description.includes(keyword) || title.includes(keyword)) {
      tradingTermCount++;
    }
  });

  score += tradingTermCount * 15;

  // Subscriber count boost (more subscribers = more reputable)
  const subscribers = parseInt(channel.statistics.subscriberCount); // This now includes actual subscribers from API
  if (subscribers > 1000000) score += 25;
  else if (subscribers > 100000) score += 20;
  else if (subscribers > 50000) score += 15;
  else if (subscribers > 10000) score += 10;
  else if (subscribers > 1000) score += 5;

  // Content freshness (newer channels might be more active)
  const publishedDate = new Date(channel.snippet.publishedAt);
  const yearsOld = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (yearsOld < 1) score += 15; // Very new channels
  else if (yearsOld < 3) score += 10; // Recent channels

  // Video count boost (more content = more active channel)
  const videoCount = parseInt(channel.statistics.videoCount);
  if (videoCount > 1000) score += 15;
  else if (videoCount > 500) score += 10;
  else if (videoCount > 100) score += 5;

  return Math.min(score, 100); // Cap at 100
}

// Search YouTube channels using Data API v3
async function searchYouTubeChannels(query: string, maxResults: number = 20): Promise<YouTubeChannelDetails[]> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
    throw new Error('YouTube API key not configured');
  }

  try {
    // Step 1: Search for channels
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' trading')}&type=channel&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      throw new Error(`YouTube Search API error: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData: YouTubeSearchResponse = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    // Step 2: Get detailed channel information
    const channelIds = searchData.items.map(item => item.id.channelId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelIds}&key=${YOUTUBE_API_KEY}`;

    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      throw new Error(`YouTube Channels API error: ${detailsResponse.status} ${detailsResponse.statusText}`);
    }

    const detailsData: YouTubeChannelsResponse = await detailsResponse.json();

    return detailsData.items || [];

  } catch (error) {
    console.error('YouTube API search error:', error);
    throw new Error('Failed to search YouTube channels');
  }
}

// Mock channels data for demo/fallback mode
const mockChannels: YouTubeChannelDetails[] = [
  {
    id: 'UCqK_GSMbpiV8spMlbzpv8Bw',
    kind: 'youtube#channel',
    etag: 'etag1',
    snippet: {
      title: 'Trading Educators Academy',
      description: 'Professional trading education with real strategies and market analysis. Daily live sessions and comprehensive courses for serious traders.',
      customUrl: 'tradingeducators',
      publishedAt: '2020-01-15T00:00:00Z',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/ccffcc/000000?text=TEA', width: 88, height: 88 },
        medium: { url: 'https://via.placeholder.com/240x240/ccffcc/000000?text=TEA', width: 240, height: 240 },
        high: { url: 'https://via.placeholder.com/480x480/ccffcc/000000?text=TEA', width: 480, height: 480 }
      },
      localized: {
        title: 'Trading Educators Academy',
        description: 'Professional trading education with real strategies and market analysis.'
      },
      country: 'US'
    },
    statistics: {
      viewCount: '34000000',
      subscriberCount: '256000',
      hiddenSubscriberCount: false,
      videoCount: '342'
    },
    brandingSettings: {
      channel: {
        title: 'Trading Educators Academy',
        description: 'Professional trading education with real strategies and market analysis.',
        keywords: 'trading forex stocks crypto technical analysis',
        defaultTab: 'home',
        moderateComments: false,
        showRelatedChannels: true
      }
    }
  },
  {
    id: 'UCVeW9qkBjo3zosnqUbG7CFw',
    kind: 'youtube#channel',
    etag: 'etag2',
    snippet: {
      title: 'The Trading Channel',
      description: 'Advanced trading strategies and market analysis. Live trading sessions and educational content for all skill levels.',
      customUrl: 'thetradingchannel',
      publishedAt: '2018-03-22T00:00:00Z',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/ffcccc/000000?text=TTC', width: 88, height: 88 },
        medium: { url: 'https://via.placeholder.com/240x240/ffcccc/000000?text=TTC', width: 240, height: 240 },
        high: { url: 'https://via.placeholder.com/480x480/ffcccc/000000?text=TTC', width: 480, height: 480 }
      },
      localized: {
        title: 'The Trading Channel',
        description: 'Advanced trading strategies and market analysis.'
      },
      country: 'GB'
    },
    statistics: {
      viewCount: '125000000',
      subscriberCount: '890000',
      hiddenSubscriberCount: false,
      videoCount: '1250'
    },
    brandingSettings: {
      channel: {
        title: 'The Trading Channel',
        description: 'Advanced trading strategies and market analysis.',
        keywords: 'trading live sessions market analysis strategies',
        defaultTab: 'home',
        moderateComments: false,
        showRelatedChannels: true
      }
    }
  }
];

// Get mock channels for demo/fallback mode
async function getMockChannels(query: string): Promise<YouTubeChannelDetails[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Filter mock data based on search query
  return mockChannels.filter(channel => {
    const title = channel.snippet.title.toLowerCase();
    const desc = channel.snippet.description.toLowerCase();
    const keywords = channel.brandingSettings?.channel?.keywords?.toLowerCase() || '';
    const searchTerm = query.toLowerCase();

    return title.includes(searchTerm) ||
           desc.includes(searchTerm) ||
           keywords.includes(searchTerm);
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const forceMockMode = searchParams.get('mode') === 'mock';
    const forceApiMode = searchParams.get('mode') === 'api';

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Get authenticated user (for future personalization)
    const user = await stackServerApp.getUser();

    // Check API mode preference and availability
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    const hasValidApiKey = Boolean(YOUTUBE_API_KEY && YOUTUBE_API_KEY !== 'your_youtube_api_key_here');

    // Determine search mode
    let useRealApi = false;

    if (forceApiMode && hasValidApiKey) {
      useRealApi = true; // Force real API
    } else if (forceMockMode) {
      useRealApi = false; // Force mock mode
    } else {
      useRealApi = hasValidApiKey; // Default to API if available
    }

    let channels: YouTubeChannelDetails[];

    if (useRealApi) {
      // Search YouTube channels with real API
      channels = await searchYouTubeChannels(query);
    } else {
      // Fallback to mock data when API unavailable or force mock mode
      channels = await getMockChannels(query);
    }

    // Filter for trading-relevant channels and score them
    const scoredChannels = channels
      .filter(channel => {
        // Only include channels with trading-related content
        const title = channel.snippet.title.toLowerCase();
        const description = channel.snippet.description.toLowerCase();
        const keywords = channel.brandingSettings?.channel?.keywords?.toLowerCase() || '';

        const tradingIndicators = ['trading', 'forex', 'crypto', 'stocks', 'analysis', 'strategy', 'technical', 'forex', 'fx', 'currency'];
        const hasTradingContent = tradingIndicators.some(term =>
          title.includes(term) || description.includes(term) || keywords.includes(term)
        );

        // Also require minimum subscriber count
        const subscribers = parseInt(channel.statistics.subscriberCount);
        const hasMinimumReach = subscribers > 500; // At least 500 subscribers

        return hasTradingContent && hasMinimumReach;
      })
      .map(channel => ({
        id: channel.id,
        relevanceScore: calculateRelevanceScore(channel, query),
        snippet: {
          channelId: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description.slice(0, 200), // Limit description
          publishedAt: channel.snippet.publishedAt,
          thumbnails: channel.snippet.thumbnails,
          customUrl: channel.snippet.customUrl
        },
        statistics: {
          viewCount: channel.statistics.viewCount,
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount,
          hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount
        },
        brandingSettings: channel.brandingSettings,
        // Since we don't have these fields from YouTube API, we'll exclude them
        // status: ... (not available in search API)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10); // Limit to top 10 results

    return NextResponse.json({
      success: true,
      data: scoredChannels,
      meta: {
        totalResults: scoredChannels.length,
        searchQuery: query,
        averageRelevanceScore: scoredChannels.length > 0
          ? scoredChannels.reduce((sum, ch) => sum + ch.relevanceScore, 0) / scoredChannels.length
          : 0,
        poweredByYouTube: true
      }
    });

  } catch (error) {
    console.error('Channel search API error:', error);

    // Return helpful error message
    const isAPIError = error instanceof Error && error.message.includes('YouTube');
    const errorMessage = isAPIError ? 'YouTube API unavailable - please configure API key' : 'Failed to search channels';

    return NextResponse.json(
      {
        error: errorMessage,
        details: isAPIError ? 'Configure YOUTUBE_API_KEY in .env.local' : undefined
      },
      { status: 500 }
    );
  }
}
