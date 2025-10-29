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
    .sort((a, b) => {
      // Sort by subscriber count descending (most subscribers first)
      const subscribersA = parseInt(a.statistics?.subscriberCount || '0');
      const subscribersB = parseInt(b.statistics?.subscriberCount || '0');

      // If subscriber counts are different, sort by subscribers
      if (subscribersA !== subscribersB) {
        return subscribersB - subscribersA; // Higher subscribers first
      }

      // If subscriber counts are the same, use relevance score as tiebreaker
      return b.relevanceScore - a.relevanceScore;
    })
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

// Mock data for demo mode - Top ICT Livestream Traders
const mockChannels = [
  // 1. Tanja Trades (Highest subscribers)
  {
    id: 'UC-TANJA-TRADES',
    snippet: {
      channelId: 'UC-TANJA-TRADES',
      title: 'Tanja Trades',
      description: 'Elite ICT trader livestreams focusing on smart money concepts, institutional order flow, and advanced price action. Live analysis of forex markets with proven strategies.',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/e91e63/ffffff?text=TT' },
        medium: { url: 'https://via.placeholder.com/240x240/e91e63/ffffff?text=TT' },
        high: { url: 'https://via.placeholder.com/240x240/e91e63/ffffff?text=TT' }
      }
    },
    statistics: {
      subscriberCount: '1250000',
      videoCount: '842',
      viewCount: '180000000'
    }
  },
  // 2. ICT Inner Circle Trader
  {
    id: 'UC-ict-inner-circle',
    snippet: {
      channelId: 'UC-ict-inner-circle',
      title: 'ICT Inner Circle Trader',
      description: 'Pure institutional trading methodology. Daily livestreams breaking down smart money movements, liquidity concepts, and manipulator tactics in forex markets.',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/9c27b0/ffffff?text=ICT' },
        medium: { url: 'https://via.placeholder.com/240x240/9c27b0/ffffff?text=ICT' },
        high: { url: 'https://via.placeholder.com/240x240/9c27b0/ffffff?text=ICT' }
      }
    },
    statistics: {
      subscriberCount: '980000',
      videoCount: '1247',
      viewCount: '250000000'
    }
  },
  // 3. Tyler Trades
  {
    id: 'UC-tyler-trades',
    snippet: {
      channelId: 'UC-tyler-trades',
      title: 'Tyler Trades',
      description: 'Advanced ICT concepts explained simply. Live sessions covering institutional supply/demand zones, optimal trade entry, and risk management strategies.',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/3f51b5/ffffff?text=TY' },
        medium: { url: 'https://via.placeholder.com/240x240/3f51b5/ffffff?text=TY' },
        high: { url: 'https://via.placeholder.com/240x240/3f51b5/ffffff?text=TY' }
      }
    },
    statistics: {
      subscriberCount: '875000',
      videoCount: '956',
      viewCount: '145000000'
    }
  },
  // 4. Fx4Living
  {
    id: 'UC-fx4living',
    snippet: {
      channelId: 'UC-fx4living',
      title: 'Fx4Living',
      description: 'Professional ICT trading advocate. Focus on sustainable wealth creation through smart money concepts, live market analysis, and mentorship.',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/009688/ffffff?text=F4L' },
        medium: { url: 'https://via.placeholder.com/240x240/009688/ffffff?text=F4L' },
        high: { url: 'https://via.placeholder.com/240x240/009688/ffffff?text=F4L' }
      }
    },
    statistics: {
      subscriberCount: '756000',
      videoCount: '634',
      viewCount: '120000000'
    }
  },
  // 5. Smart Money Concepts
  {
    id: 'UC-smart-money-concepts',
    snippet: {
      channelId: 'UC-smart-money-concepts',
      title: 'Smart Money Concepts',
      description: 'Deep dive into ICT trading philosophy. Weekly livestreams dissecting institutional behavior, order flow analysis, and market structure shifts.',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/ff9800/000000?text=SMC' },
        medium: { url: 'https://via.placeholder.com/240x240/ff9800/000000?text=SMC' },
        high: { url: 'https://via.placeholder.com/240x240/ff9800/000000?text=SMC' }
      }
    },
    statistics: {
      subscriberCount: '683000',
      videoCount: '892',
      viewCount: '98000000'
    }
  },
  // 6. Lord of Merchants
  {
    id: 'UC-lord-of-merchants',
    snippet: {
      channelId: 'UC-lord-of-merchants',
      title: 'Lord of Merchants',
      description: 'Master ICT trader sharing elite strategies. Daily market commentary focusing on institutional accumulation/distribution and liquidity grabs.',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/795548/ffffff?text=LOM' },
        medium: { url: 'https://via.placeholder.com/240x240/795548/ffffff?text=LOM' },
        high: { url: 'https://via.placeholder.com/240x240/795548/ffffff?text=LOM' }
      }
    },
    statistics: {
      subscriberCount: '542000',
      videoCount: '721',
      viewCount: '89000000'
    }
  },
  // 7. Charmaine (ICT Trading)
  {
    id: 'UC-charmaine-ict',
    snippet: {
      channelId: 'UC-charmaine-ict',
      title: 'Charmaine ICT Trading',
      description: 'Female ICT perspective on trading markets. Focus on psychological aspects of institutional trading with live session breakdowns and strategy guides.',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/e91e63/ffffff?text=CH' },
        medium: { url: 'https://via.placeholder.com/240x240/e91e63/ffffff?text=CH' },
        high: { url: 'https://via.placeholder.com/240x240/e91e63/ffffff?text=CH' }
      }
    },
    statistics: {
      subscriberCount: '498000',
      videoCount: '568',
      viewCount: '76400000'
    }
  },
  // 8. Institutional Order Flow
  {
    id: 'UC-institutional-order-flow',
    snippet: {
      channelId: 'UC-institutional-order-flow',
      title: 'Institutional Order Flow',
      description: 'Technical analysis through ICT lens. Live trading sessions analyzing institutional buying/selling behavior and smart money positioning.',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/607d8b/ffffff?text=IOF' },
        medium: { url: 'https://via.placeholder.com/240x240/607d8b/ffffff?text=IOF' },
        high: { url: 'https://via.placeholder.com/240x240/607d8b/ffffff?text=IOF' }
      }
    },
    statistics: {
      subscriberCount: '421000',
      videoCount: '783',
      viewCount: '67000000'
    }
  },
  // 9. Liquidity Hunter
  {
    id: 'UC-liquidity-hunter',
    snippet: {
      channelId: 'UC-liquidity-hunter',
      title: 'Liquidity Hunter',
      description: 'ICT-focused trading strategies. Specializing in liquidity concepts, manipulation tactics, and institutional trading zones for consistent profits.',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/2196f3/ffffff?text=LH' },
        medium: { url: 'https://via.placeholder.com/240x240/2196f3/ffffff?text=LH' },
        high: { url: 'https://via.placeholder.com/240x240/2196f3/ffffff?text=LH' }
      }
    },
    statistics: {
      subscriberCount: '387000',
      videoCount: '445',
      viewCount: '58000000'
    }
  },
  // 10. Market Structure Pro
  {
    id: 'UC-market-structure-pro',
    snippet: {
      channelId: 'UC-market-structure-pro',
      title: 'Market Structure Pro',
      description: 'Advanced ICT market structure analysis. Daily videos breaking down institutional shifts, supply/demand imbalances, and smart money movements.',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/4caf50/ffffff?text=MSP' },
        medium: { url: 'https://via.placeholder.com/240x240/4caf50/ffffff?text=MSP' },
        high: { url: 'https://via.placeholder.com/240x240/4caf50/ffffff?text=MSP' }
      }
    },
    statistics: {
      subscriberCount: '356000',
      videoCount: '687',
      viewCount: '52000000'
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
