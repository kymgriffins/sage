import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Mock data for when YouTube API is not available
const MOCK_CHANNEL_DATA = [
  {
    kind: "youtube#channel",
    etag: "mock-etag-1",
    id: "UCTovmBbgOEgi4iXqSH3IxjQ",
    snippet: {
      title: "Patrick Wieland",
      description: "Professional trading education and live market analysis.",
      customUrl: "@patrickwieland",
      publishedAt: "2017-01-16T13:49:57Z",
      thumbnails: {
        default: { url: "https://yt3.ggpht.com/mock_thumb_1.jpg", width: 88, height: 88 },
        medium: { url: "https://yt3.ggpht.com/mock_thumb_1.jpg", width: 240, height: 240 },
        high: { url: "https://yt3.ggpht.com/mock_thumb_1.jpg", width: 800, height: 800 }
      },
      localized: {
        title: "Patrick Wieland",
        description: "Professional trading education and live market analysis."
      },
      country: "US"
    },
    statistics: {
      viewCount: "45861245",
      subscriberCount: "459000",
      hiddenSubscriberCount: false,
      videoCount: "3283"
    },
    relevanceScore: 100
  },
  {
    kind: "youtube#channel",
    etag: "mock-etag-2",
    id: "UChiJI6aZx9XflzWBg98p6TA",
    snippet: {
      title: "Tanisha Garg",
      description: "Certified Research Analyst providing stock market education.",
      customUrl: "@tanishagarg101",
      publishedAt: "2022-12-25T14:07:03Z",
      thumbnails: {
        default: { url: "https://yt3.ggpht.com/mock_thumb_2.jpg", width: 88, height: 88 },
        medium: { url: "https://yt3.ggpht.com/mock_thumb_2.jpg", width: 240, height: 240 },
        high: { url: "https://yt3.ggpht.com/mock_thumb_2.jpg", width: 800, height: 800 }
      },
      localized: {
        title: "Tanisha Garg",
        description: "Certified Research Analyst providing stock market education."
      },
      country: "IN"
    },
    statistics: {
      viewCount: "1033471",
      subscriberCount: "117000",
      hiddenSubscriberCount: false,
      videoCount: "171"
    },
    relevanceScore: 85
  },
  {
    kind: "youtube#channel",
    etag: "mock-etag-3",
    id: "UCnuUPG2uJ3lO0FOfc8bZdAA",
    snippet: {
      title: "The Trade Bureau!",
      description: "Educational content for trading and investing with live webinars.",
      customUrl: "@thtradebureau",
      publishedAt: "2021-04-18T06:51:57Z",
      thumbnails: {
        default: { url: "https://yt3.ggpht.com/mock_thumb_3.jpg", width: 88, height: 88 },
        medium: { url: "https://yt3.ggpht.com/mock_thumb_3.jpg", width: 240, height: 240 },
        high: { url: "https://yt3.ggpht.com/mock_thumb_3.jpg", width: 800, height: 800 }
      },
      localized: {
        title: "The Trade Bureau!",
        description: "Educational content for trading and investing with live webinars."
      }
    },
    statistics: {
      viewCount: "64140",
      subscriberCount: "6480",
      hiddenSubscriberCount: false,
      videoCount: "123"
    },
    relevanceScore: 94
  },
  {
    kind: "youtube#channel",
    etag: "mock-etag-4",
    id: "UCAu0F47nG0YNC-V2ZSDQnKg",
    snippet: {
      title: "profesor forex",
      description: "Free forex trading education and market analysis.",
      customUrl: "@profesorforex",
      publishedAt: "2024-03-26T09:46:05Z",
      thumbnails: {
        default: { url: "https://yt3.ggpht.com/mock_thumb_4.jpg", width: 88, height: 88 },
        medium: { url: "https://yt3.ggpht.com/mock_thumb_4.jpg", width: 240, height: 240 },
        high: { url: "https://yt3.ggpht.com/mock_thumb_4.jpg", width: 800, height: 800 }
      },
      localized: {
        title: "profesor forex",
        description: "Free forex trading education and market analysis."
      },
      country: "ID"
    },
    statistics: {
      viewCount: "16693",
      subscriberCount: "1560",
      hiddenSubscriberCount: false,
      videoCount: "33"
    },
    relevanceScore: 29
  },
  {
    kind: "youtube#channel",
    etag: "mock-etag-5",
    id: "UCYlxOg6xN_pegDZf0APkS_A",
    snippet: {
      title: "ChunkTraderFX🇲🇨",
      description: "Trading education for forex and market analysis.",
      customUrl: "@chunktraderfx",
      publishedAt: "2022-06-30T05:10:08Z",
      thumbnails: {
        default: { url: "https://yt3.ggpht.com/mock_thumb_5.jpg", width: 88, height: 88 },
        medium: { url: "https://yt3.ggpht.com/mock_thumb_5.jpg", width: 240, height: 240 },
        high: { url: "https://yt3.ggpht.com/mock_thumb_5.jpg", width: 800, height: 800 }
      },
      localized: {
        title: "ChunkTraderFX🇲🇨",
        description: "Trading education for forex and market analysis."
      },
      country: "ID"
    },
    statistics: {
      viewCount: "8334",
      subscriberCount: "775",
      hiddenSubscriberCount: false,
      videoCount: "45"
    },
    relevanceScore: 60
  }
];

/**
 * GET /api/channels/search - Search for YouTube channels
 * Query params: q (search query), mode (auto|mock|api)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const mode = searchParams.get('mode') || 'auto';

    console.log(`Channel search request - query: "${query}", mode: ${mode}`);

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    let searchResults: any[] = [];
    let searchMode = mode;
    let poweredByYouTube = false;
    let totalResults = 0;

    // Determine search mode
    if (mode === 'mock') {
      // Always use mock data
      console.log('Using mock data mode');
      const filteredMockData = MOCK_CHANNEL_DATA.filter(channel =>
        channel.snippet.title.toLowerCase().includes(query.toLowerCase()) ||
        channel.snippet.description.toLowerCase().includes(query.toLowerCase())
      );
      searchResults = filteredMockData.map(item => ({
        ...item,
        relevanceScore: Math.floor(Math.random() * 50) + 50 // Random relevance
      }));
      searchMode = 'mock';
      totalResults = searchResults.length;
    } else if (mode === 'api' || (mode === 'auto' && process.env.YOUTUBE_API_KEY)) {
      // Try YouTube API
      console.log('Attempting YouTube API search');

      if (!process.env.YOUTUBE_API_KEY) {
        console.log('YouTube API key not configured, falling back to mock');
        searchMode = mode === 'api' ? 'error_fallback' : 'auto_mock_fallback';
        const filteredMockData = MOCK_CHANNEL_DATA.filter(channel =>
          channel.snippet.title.toLowerCase().includes(query.toLowerCase()) ||
          channel.snippet.description.toLowerCase().includes(query.toLowerCase())
        );
        searchResults = filteredMockData.map(item => ({
          ...item,
          relevanceScore: Math.floor(Math.random() * 50) + 50
        }));
        totalResults = searchResults.length;
      } else {
        try {
          const youtube = google.youtube({
            version: 'v3',
            auth: process.env.YOUTUBE_API_KEY,
          });

          const searchResponse = await youtube.search.list({
            part: ['snippet'],
            q: query,
            type: ['channel'],
            maxResults: 10, // Can expand later
            safeSearch: 'strict',
            relevanceLanguage: 'en'
          });

          if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
            console.log('No channels found via YouTube API');
            searchResults = [];
            totalResults = 0;
          } else {
            // Get detailed channel info
            const channelIds = searchResponse.data.items
              .map(item => item.id?.channelId)
              .filter((id): id is string => Boolean(id));

            if (channelIds.length === 0) {
              searchResults = [];
              totalResults = 0;
            } else {
              const channelsResponse = await youtube.channels.list({
                part: ['snippet', 'statistics'],
                id: channelIds,
                maxResults: channelIds.length,
              });

              searchResults = (channelsResponse.data.items || []).map((channel, index) => ({
                kind: "youtube#channel",
                etag: `api-${channel.id}-${Date.now()}`,
                id: channel.id,
                snippet: {
                  channelId: channel.id,
                  title: channel.snippet?.title || '',
                  description: channel.snippet?.description || '',
                  customUrl: channel.snippet?.customUrl,
                  publishedAt: channel.snippet?.publishedAt,
                  thumbnails: channel.snippet?.thumbnails || {
                    default: { url: '', width: 88, height: 88 },
                    medium: { url: '', width: 240, height: 240 },
                    high: { url: '', width: 800, height: 800 }
                  },
                  localized: channel.snippet?.localized || {
                    title: channel.snippet?.title || '',
                    description: channel.snippet?.description || ''
                  },
                  country: channel.snippet?.country
                },
                statistics: {
                  viewCount: channel.statistics?.viewCount || '0',
                  subscriberCount: channel.statistics?.subscriberCount || '0',
                  hiddenSubscriberCount: false,
                  videoCount: channel.statistics?.videoCount || '0'
                },
                relevanceScore: 50
              }));

              totalResults = searchResults.length;
              poweredByYouTube = true;
              searchMode = 'api';
            }
          }
        } catch (apiError: any) {
          console.error('YouTube API error:', apiError?.message);
          console.log('Falling back to mock data');

          const filteredMockData = MOCK_CHANNEL_DATA.filter(channel =>
            channel.snippet.title.toLowerCase().includes(query.toLowerCase()) ||
            channel.snippet.description.toLowerCase().includes(query.toLowerCase())
          );
          searchResults = filteredMockData.map(item => ({
            ...item,
            relevanceScore: Math.floor(Math.random() * 50) + 50
          }));
          searchMode = 'error_fallback';
          totalResults = searchResults.length;
        }
      }
    } else {
      // Auto mode fallback to mock
      console.log('Auto mode falling back to mock data (no API key)');
      const filteredMockData = MOCK_CHANNEL_DATA.filter(channel =>
        channel.snippet.title.toLowerCase().includes(query.toLowerCase()) ||
        channel.snippet.description.toLowerCase().includes(query.toLowerCase())
      );
      searchResults = filteredMockData.map(item => ({
        ...item,
        relevanceScore: Math.floor(Math.random() * 50) + 50
      }));
      searchMode = 'auto_mock_fallback';
      totalResults = searchResults.length;
    }

    // Sort results by relevance score (highest first)
    searchResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    console.log(`Search completed: ${searchResults.length} results via ${searchMode}`);

    return NextResponse.json({
      success: true,
      data: searchResults,
      meta: {
        totalResults,
        searchQuery: query,
        mode: searchMode,
        poweredByYouTube,
        enhancedQuery: true,
        topRelevanceScore: searchResults[0]?.relevanceScore || 0,
        searchedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Channel search error:', error);
    return NextResponse.json(
      { error: 'Failed to search channels', details: error?.message },
      { status: 500 }
    );
  }
}
