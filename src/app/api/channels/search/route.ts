import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// SEARCH LOGIC ORGANIZATION
// ============================================================================

// Trading-specific keywords and terms for better relevance scoring
const TRADING_KEYWORDS = {
  core: ['trading', 'trade', 'forex', 'fx', 'currency', 'stocks', 'equities', 'crypto', 'cryptocurrency', 'bitcoin', 'btc'],
  analysis: ['analysis', 'technical analysis', 'price action', 'scalping', 'day trading', 'swing trading', 'market analysis'],
  education: ['strategy', 'strategies', 'mentor', 'education', 'academy', 'school', 'course', 'tutorial'],
  indicators: ['ict', 'smart money', 'institutional', 'volume', 'trend', 'pattern', 'chart', 'candle', 'support', 'resistance']
};

interface YouTubeSearchResponse {
  items: Array<{
    id: { channelId: string };
    snippet: {
      channelId: string;
      title: string;
      description: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
      };
      customUrl?: string;
    };
  }>;
}

interface YouTubeChannelResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        default: { url: string };
        medium: { url: string };
        high: { url: string };
      };
      customUrl?: string;
    };
    statistics: {
      subscriberCount: string;
      videoCount: string;
      viewCount: string;
    };
  }>;
}

// ============================================================================
// SEARCH LOGIC FUNCTIONS
// ============================================================================

/**
 * Calculate trading relevance score for a channel based on trading-related content
 */
function calculateTradingRelevance(channel: any, query: string): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  const title = channel.snippet?.title?.toLowerCase() || '';
  const description = channel.snippet?.description?.toLowerCase() || '';

  // Exact query match in title (highest weight)
  if (title.includes(queryLower)) {
    score += 40;
    if (title.startsWith(queryLower)) score += 20; // Exact match at start
  }

  // Trading keyword matching across different categories
  let keywordMatches = 0;
  const allKeywords = [
    ...TRADING_KEYWORDS.core,
    ...TRADING_KEYWORDS.analysis,
    ...TRADING_KEYWORDS.education,
    ...TRADING_KEYWORDS.indicators
  ];

  allKeywords.forEach(keyword => {
    if (title.includes(keyword) || description.includes(keyword)) {
      keywordMatches++;
    }
  });

  // Score based on number of trading keyword matches
  score += keywordMatches * 12;

  // Subscriber count boost (credibility indicator)
  const subscribers = parseInt(channel.statistics?.subscriberCount || '0');
  if (subscribers > 1000000) score += 25;
  else if (subscribers > 100000) score += 20;
  else if (subscribers > 50000) score += 15;
  else if (subscribers > 10000) score += 10;
  else if (subscribers > 1000) score += 5;

  // Video count boost (active channel indicator)
  const videos = parseInt(channel.statistics?.videoCount || '0');
  if (videos > 1000) score += 15;
  else if (videos > 500) score += 10;
  else if (videos > 100) score += 5;

  return Math.min(score, 100); // Cap at 100
}

/**
 * Filter channels for trading relevance and add relevance scores
 */
function filterAndScoreChannels(channels: any[], query: string): any[] {
  return channels
    .filter(channel => {
      // Must have minimum reach and contain trading keywords
      const subscribers = parseInt(channel.statistics?.subscriberCount || '0');
      const hasMinimumReach = subscribers > 500;

      const title = channel.snippet?.title?.toLowerCase() || '';
      const description = channel.snippet?.description?.toLowerCase() || '';

      // Check for trading keywords
      const hasTradingContent = [...TRADING_KEYWORDS.core, ...TRADING_KEYWORDS.analysis]
        .some(keyword => title.includes(keyword) || description.includes(keyword));

      return hasMinimumReach && hasTradingContent;
    })
    .map(channel => ({
      ...channel,
      relevanceScore: calculateTradingRelevance(channel, query)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10); // Top 10 results
}

/**
 * Search YouTube for channels using the Data API
 */
async function searchYouTubeChannels(query: string, apiKey: string): Promise<any[]> {
  // Enhanced search query for better trading channel results
  const enhancedQuery = `${query} trading forex crypto analysis strategy`;

  // Step 1: Search for channels
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=25&q=${encodeURIComponent(enhancedQuery)}&order=relevance&key=${apiKey}`;

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    const errorData = await searchResponse.json();
    throw new Error(`YouTube Search API: ${errorData.error?.message || 'Search failed'}`);
  }

  const searchData = await searchResponse.json();

  if (!searchData.items?.length) {
    return [];
  }

  // Step 2: Get detailed channel information
  const channelIds = searchData.items.map((item: any) => item.id.channelId).join(',');

  const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${apiKey}`;

  const channelsResponse = await fetch(channelsUrl);
  if (!channelsResponse.ok) {
    const errorData = await channelsResponse.json();
    throw new Error(`YouTube Channels API: ${errorData.error?.message || 'Channel details failed'}`);
  }

  const channelsData = await channelsResponse.json();

  return channelsData.items || [];
}

// Mock data for demo mode
const mockChannels = [
  {
    id: 'UCqK_GSMbpiV8spMlbzpv8Bw',
    snippet: {
      channelId: 'UCqK_GSMbpiV8spMlbzpv8Bw',
      title: 'Trading Educators Academy',
      description: 'Professional trading education with real strategies and market analysis. Daily live sessions and comprehensive courses.',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/ccffcc/000000?text=TEA' },
        medium: { url: 'https://via.placeholder.com/240x240/ccffcc/000000?text=TEA' },
        high: { url: 'https://via.placeholder.com/240x240/ccffcc/000000?text=TEA' }
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
        medium: { url: 'https://via.placeholder.com/240x240/ffcccc/000000?text=TTC' },
        high: { url: 'https://via.placeholder.com/240x240/ffcccc/000000?text=TTC' }
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
        medium: { url: 'https://via.placeholder.com/240x240/ffccaa/000000?text=ICT' },
        high: { url: 'https://via.placeholder.com/240x240/ffccaa/000000?text=ICT' }
      }
    },
    statistics: {
      subscriberCount: '456000',
      videoCount: '289',
      viewCount: '78800000'
    }
  }
];

// ============================================================================
// MAIN API ENDPOINT
// ============================================================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim();
  const mode = searchParams.get('mode') || 'auto';

  // Input validation
  if (!query) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 }
    );
  }

  if (query.length < 2) {
    return NextResponse.json(
      { error: 'Search query must be at least 2 characters' },
      { status: 400 }
    );
  }

  try {
    // Mode handling - Mock mode
    if (mode === 'mock') {
      const filteredChannels = filterAndScoreChannels(mockChannels, query);

      return NextResponse.json({
        success: true,
        data: filteredChannels,
        meta: {
          poweredByYouTube: false,
          totalResults: filteredChannels.length,
          mode: 'mock',
          searchQuery: query,
          topRelevanceScore: filteredChannels[0]?.relevanceScore || 0
        }
      });
    }

    // Get API key and determine search strategy
    const apiKey = process.env.YOUTUBE_API_KEY;

    // Mode validation
    if (!apiKey && mode === 'api') {
      return NextResponse.json({
        success: false,
        error: 'YouTube API key not configured. Set YOUTUBE_API_KEY in environment variables.',
        details: 'API key required for real YouTube search. Try mock mode instead.',
        meta: { mode: 'api_error' }
      }, { status: 500 });
    }

    // Auto mode without API key falls back to mock
    if (mode === 'auto' && !apiKey) {
      const filteredChannels = filterAndScoreChannels(mockChannels, query);

      return NextResponse.json({
        success: true,
        data: filteredChannels,
        meta: {
          poweredByYouTube: false,
          totalResults: filteredChannels.length,
          mode: 'auto_mock_fallback',
          searchQuery: query,
          note: 'API key not available, using demo data'
        }
      });
    }

    // Real YouTube search
    if (!apiKey) {
      throw new Error('No API key available for search');
    }

    const channels = await searchYouTubeChannels(query, apiKey);
    const filteredChannels = filterAndScoreChannels(channels, query);

    return NextResponse.json({
      success: true,
      data: filteredChannels,
      meta: {
        poweredByYouTube: true,
        totalResults: filteredChannels.length,
        mode: 'api',
        searchQuery: query,
        enhancedQuery: true, // Used enhanced search terms
        topRelevanceScore: filteredChannels[0]?.relevanceScore || 0
      }
    });

  } catch (error) {
    console.error('Channel search API error:', error);

    // Determine error type and provide appropriate fallback
    const errorMessage = error instanceof Error ? error.message : 'Unknown search error';
    const isApiError = errorMessage.includes('YouTube') || errorMessage.includes('API');

    // Always provide fallback mock results on error
    const fallbackChannels = filterAndScoreChannels(mockChannels, query)
      .slice(0, 5); // Limit fallback results

    return NextResponse.json({
      success: false, // Mark as error but provide fallback data
      data: fallbackChannels, // Still provide some results
      error: errorMessage,
      meta: {
        poweredByYouTube: false,
        totalResults: fallbackChannels.length,
        mode: 'error_fallback',
        searchQuery: query,
        originalError: isApiError ? 'YouTube API unavailable' : 'Search processing error',
        suggestion: isApiError ? 'Check API key or try mock mode' : 'Try simplifying your search'
      }
    }, { status: 500 }); // Return HTTP error status
  }
}
