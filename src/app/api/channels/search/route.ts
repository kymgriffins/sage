// YouTube Channel Search API
// GET /api/channels/search?q=searchQuery

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';

// Mock YouTube API response for trading channels
const mockChannels = [
  {
    id: 'UCqK_GSMbpiV8spMlbzpv8Bw',
    snippet: {
      channelId: 'UCqK_GSMbpiV8spMlbzpv8Bw',
      title: 'Trading Educators Academy',
      description: 'Professional trading education with real strategies and market analysis. Daily live sessions and comprehensive courses.',
      publishedAt: '2020-01-15T00:00:00Z',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/ccffcc/000000?text=TEA', width: 88, height: 88 },
        medium: { url: 'https://via.placeholder.com/240x240/ccffcc/000000?text=TEA', width: 240, height: 240 }
      },
      customUrl: 'tradingeducators'
    },
    statistics: {
      viewCount: '34000000',
      subscriberCount: '256000',
      videoCount: '342',
      hiddenSubscriberCount: false
    },
    brandingSettings: {
      channel: {
        keywords: 'trading forex stocks crypto technical analysis',
        featuredChannelsTitle: 'Featured Channels',
        moderateComments: false,
        showRelatedChannels: true,
        showBrowseView: true,
        makeRelatedChannelsVisible: true
      }
    },
    status: {
      privacyStatus: 'public',
      isLinked: true,
      longUploadsStatus: 'elongated',
      madeForKids: false
    }
  },
  {
    id: 'UCVeW9qkBjo3zosnqUbG7CFw',
    snippet: {
      channelId: 'UCVeW9qkBjo3zosnqUbG7CFw',
      title: 'The Trading Channel',
      description: 'Advanced trading strategies and market analysis. Live trading sessions and educational content for all skill levels.',
      publishedAt: '2018-03-22T00:00:00Z',
      thumbnails: {
        default: { url: 'https://via.placeholder.com/88x88/ffcccc/000000?text=TTC', width: 88, height: 88 },
        medium: { url: 'https://via.placeholder.com/240x240/ffcccc/000000?text=TTC', width: 240, height: 240 }
      },
      customUrl: 'thetradingchannel'
    },
    statistics: {
      viewCount: '125000000',
      subscriberCount: '890000',
      videoCount: '1250',
      hiddenSubscriberCount: false
    },
    brandingSettings: {
      channel: {
        keywords: 'trading live sessions market analysis strategies',
        moderateComments: false,
        showRelatedChannels: true
      }
    },
    status: {
      privacyStatus: 'public',
      isLinked: true,
      longUploadsStatus: 'allowed'
    }
  }
];

// Calculate trading relevance score
function calculateRelevanceScore(channel: any, searchQuery: string): number {
  let score = 0;
  const query = searchQuery.toLowerCase();
  const title = channel.snippet.title.toLowerCase();
  const description = channel.snippet.description.toLowerCase();
  const keywords = channel.brandingSettings?.channel?.keywords?.toLowerCase() || '';

  // Exact match in title = high score
  if (title.includes(query)) {
    score += 30;
    if (title.startsWith(query)) score += 20; // Starts with query
  }

  // Keyword matches
  if (keywords.includes(query)) score += 25;

  // Description relevance
  if (description.includes(query)) score += 15;

  // Trading-related terms boost
  const tradingTerms = ['trading', 'forex', 'crypto', 'stocks', 'analysis', 'strategy', 'technical'];
  tradingTerms.forEach(term => {
    if (query.includes(term) && (title.includes(term) || keywords.includes(term))) {
      score += 10;
    }
  });

  // Subscriber count boost (more subscribers = more reputable)
  const subscribers = parseInt(channel.statistics.subscriberCount);
  if (subscribers > 100000) score += 15;
  else if (subscribers > 50000) score += 10;
  else if (subscribers > 10000) score += 5;

  // Content freshness (newer channels might be more active)
  const publishedDate = new Date(channel.snippet.publishedAt);
  const yearsOld = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (yearsOld < 2) score += 10;

  return Math.min(score, 100); // Cap at 100
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Get authenticated user (would be used for personalization)
    const user = await stackServerApp.getUser();

    // TODO: Replace with actual YouTube Data API v3 call
    // const results = await searchYouTubeChannels(query, user);

    // Filter and score mock results based on search
    const filteredChannels = mockChannels
      .filter(channel => {
        const title = channel.snippet.title.toLowerCase();
        const desc = channel.snippet.description.toLowerCase();
        const keywords = channel.brandingSettings?.channel?.keywords?.toLowerCase() || '';
        const searchTerm = query.toLowerCase();

        return title.includes(searchTerm) ||
               desc.includes(searchTerm) ||
               keywords.includes(searchTerm);
      })
      .map(channel => ({
        ...channel,
        relevanceScore: calculateRelevanceScore(channel, query),
        isTradingRelated: true, // All mock channels are trading-related
        searchQuery: query
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10); // Limit results

    if (filteredChannels.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          totalResults: 0,
          searchSuggestion: `Try searching for "${query} trading" or "${query} analysis"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredChannels,
      meta: {
        totalResults: filteredChannels.length,
        hasMore: false, // Pagination can be added later
        searchQuery: query,
        averageRelevanceScore: filteredChannels.reduce((sum, ch) => sum + ch.relevanceScore, 0) / filteredChannels.length
      }
    });

  } catch (error) {
    console.error('Channel search error:', error);
    return NextResponse.json(
      { error: 'Failed to search channels' },
      { status: 500 }
    );
  }
}
