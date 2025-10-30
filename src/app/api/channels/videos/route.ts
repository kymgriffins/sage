import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { db } from '@/lib/db';
import { streams, channels, channelSubscriptions } from '@/lib/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { google } from 'googleapis';

/**
 * GET /api/channels/videos - Get videos for user's subscribed channels
 * Query params: channelId (optional) - specific channel, if not provided gets all user's channels
 *              limit (optional) - max videos per category, default 10
 */

export async function GET(request: NextRequest) {
  console.log(`🔍 === VIDEOS API REQUEST STARTED ===`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(`🌐 Request URL: ${request.url}`);

  try {
    // Get authenticated user
    console.log(`👤 Checking user authentication...`);
    const user = await stackServerApp.getUser();
    if (!user) {
      console.log(`❌ User not authenticated - returning 401`);
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log(`✅ User authenticated: ${!!user}`);
    console.log(`🆔 User ID: ${user?.id}`);
    console.log(`📋 Parameters:`);
    console.log(`   - channelId: "${channelId}"`);
    console.log(`   - limit: ${limit}`);
    console.log(`   - all params:`, Object.fromEntries(searchParams.entries()));

    // Initialize YouTube API for potential live stream detection
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });

    let videos: any[] = [];

    console.log(`🗄️ Fetching videos from database...`);
    console.log(`   - Mode: ${channelId ? 'Specific channel' : 'All user channels'}`);

    // For tutelage page (specific channel), fetch directly from YouTube
    if (channelId) {
      console.log(`🎯 Fetching videos DIRECTLY from YouTube for channel: ${channelId}`);

      try {
        console.log('📡 Calling YouTube API for latest videos...');

        // Get videos directly from YouTube Search API
        const videosResponse = await youtube.search.list({
          part: ['snippet'],
          channelId: channelId,
          order: 'date',
          type: ['video'],
          maxResults: Math.min(limit * 3, 50), // Get more to categorize from, max 50
        });

        const youtubeVideos = videosResponse.data.items || [];
        console.log(`🎬 YouTube returned ${youtubeVideos.length} recent videos`);

        if (youtubeVideos.length > 0) {
          // Get detailed video info including live streaming status
          const videoIds = youtubeVideos.map((v: any) => v.id!.videoId!);
          const videoDetailsResponse = await youtube.videos.list({
            part: ['snippet', 'statistics', 'contentDetails', 'liveStreamingDetails'],
            id: videoIds,
          });

          const detailedVideos = videoDetailsResponse.data.items || [];

          // Transform YouTube data to match our expected format
          videos = detailedVideos.map((detail: any) => {
            const searchItem = youtubeVideos.find((v: any) => v.id!.videoId === detail.id);
            return {
              id: `youtube_${detail.id}`, // Use YouTube ID for our internal ID
              youtubeId: detail.id,
              youtubeUrl: `https://www.youtube.com/watch?v=${detail.id}`,
              title: detail.snippet?.title || '',
              description: detail.snippet?.description || '',
              createdAt: new Date(detail.snippet?.publishedAt || Date.now()),
              channelId: detail.snippet?.channelId,
              channelTitle: detail.snippet?.channelTitle,
              youtubeChannelId: detail.snippet?.channelId,
              isLive: !!detail.liveStreamingDetails?.actualStartTime,
              // Add additional YouTube data
              viewCount: detail.statistics?.viewCount,
              likeCount: detail.statistics?.likeCount,
              commentCount: detail.statistics?.commentCount,
              duration: detail.contentDetails?.duration,
              thumbnailUrl: detail.snippet?.thumbnails?.high?.url ||
                           detail.snippet?.thumbnails?.medium?.url ||
                           detail.snippet?.thumbnails?.default?.url,
            };
          });

          console.log(`✅ Successfully fetched ${videos.length} videos from YouTube`);
        } else {
          console.log('⚠️ No videos found from YouTube search');
        }

      } catch (youtubeError: any) {
        console.error('❌ YouTube API error:', youtubeError?.message || youtubeError);
        console.log('🔄 Falling back to database lookup...');

        // Fallback to database if YouTube API fails
        videos = await db
          .select({
            id: streams.id,
            youtubeId: streams.youtubeId,
            youtubeUrl: streams.youtubeUrl,
            title: streams.title,
            description: streams.description,
            createdAt: streams.createdAt,
            channelId: channels.id,
            channelTitle: channels.channelTitle,
            youtubeChannelId: channels.youtubeChannelId,
            isLive: streams.isLive,
          })
          .from(streams)
          .innerJoin(channels, eq(streams.channelId, channels.id))
          .innerJoin(channelSubscriptions, eq(channels.id, channelSubscriptions.channelId))
          .where(and(
            eq(channelSubscriptions.userId, user.id),
            eq(channels.youtubeChannelId, channelId)
          ))
          .orderBy(desc(streams.createdAt));
      }
    } else {
      console.log(`🎬 Fetching videos for all user channels from database`);

      // Get videos from all user's subscribed channels (from database)
      videos = await db
        .select({
          id: streams.id,
          youtubeId: streams.youtubeId,
          youtubeUrl: streams.youtubeUrl,
          title: streams.title,
          description: streams.description,
          createdAt: streams.createdAt,
          channelId: channels.id,
          channelTitle: channels.channelTitle,
          youtubeChannelId: channels.youtubeChannelId,
          isLive: streams.isLive,
        })
        .from(streams)
        .innerJoin(channels, eq(streams.channelId, channels.id))
        .innerJoin(channelSubscriptions, eq(channels.id, channelSubscriptions.channelId))
        .where(eq(channelSubscriptions.userId, user.id))
        .orderBy(desc(streams.createdAt));
    }

    console.log(`✅ Database query completed. Found ${videos.length} video(s)`);

    // Log the first few videos for debugging
    if (videos.length > 0) {
      console.log(`📹 Sample videos found:`);
      videos.slice(0, 3).forEach((video, index) => {
        console.log(`   ${index + 1}. "${video.title}" (ID: ${video.youtubeId})`);
        console.log(`      Channel: ${video.channelTitle}`);
        console.log(`      Created: ${video.createdAt}`);
        console.log(`      Live: ${video.isLive}`);
      });
      if (videos.length > 3) {
        console.log(`   ... and ${videos.length - 3} more`);
      }
    } else {
      console.log(`❌ No videos found in database for this query`);
    }

    if (videos.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          categories: {
            liveStreams: [],
            tradeReviews: [],
            weeklyOutlooks: [],
            weeklyForecasts: []
          },
          summary: {
            totalVideos: 0,
            totalLiveStreams: 0,
            totalTradeReviews: 0,
            totalWeeklyOutlooks: 0,
            totalWeeklyForecasts: 0
          }
        }
      });
    }

    // Function to categorize videos based on title and description
    const categorizeVideo = (video: any) => {
      const title = (video.title || '').toLowerCase();
      const description = (video.description || '').toLowerCase();

      // Check for live streams
      if (video.isLive || title.includes('live') || title.includes('stream') || description.includes('live stream')) {
        return 'liveStreams';
      }

      // Check for weekly forecasts
      if ((title.includes('weekly forecast') || title.includes('weekly outlook') || title.includes('week ahead')) &&
          (title.includes('forecast') || description.includes('forecast'))) {
        return 'weeklyForecasts';
      }

      // Check for weekly outlooks (broader than forecasts)
      if ((title.includes('weekly') || title.includes('week')) &&
          (title.includes('outlook') || title.includes('review') || title.includes('analysis') || title.includes('market'))) {
        return 'weeklyOutlooks';
      }

      // Check for trade reviews/breakdowns
      if (title.includes('trade review') || title.includes('trade breakdown') ||
          title.includes('market review') || title.includes('setup review') ||
          title.includes('analysis') || title.includes('breakdown') ||
          (title.includes('review') && (title.includes('trade') || title.includes('market') || title.includes('analysis')))) {
        return 'tradeReviews';
      }

      // Default to trade reviews if unclear
      return 'tradeReviews';
    };

    // Group videos by category
    const categorized = {
      liveStreams: [] as any[],
      tradeReviews: [] as any[],
      weeklyOutlooks: [] as any[],
      weeklyForecasts: [] as any[]
    };

    videos.forEach(video => {
      const category = categorizeVideo(video);
      categorized[category as keyof typeof categorized].push({
        id: video.id,
        youtubeId: video.youtubeId,
        youtubeUrl: video.youtubeUrl,
        title: video.title,
        description: video.description,
        publishedAt: video.createdAt?.toISOString(),
        channelTitle: video.channelTitle,
        channelId: video.youtubeChannelId,
        category,
        isLive: video.isLive,
        // Add some metadata for better display
        thumbnailUrl: `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
        daysSincePublished: video.createdAt ?
          Math.floor((Date.now() - video.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : null
      });
    });

    // Sort each category by published date (newest first) and limit results
    Object.keys(categorized).forEach(categoryKey => {
      const key = categoryKey as keyof typeof categorized;
      categorized[key] = categorized[key]
        .sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
        .slice(0, limit);
    });

    // Calculate summary stats
    const summary = {
      totalVideos: videos.length,
      totalLiveStreams: categorized.liveStreams.length,
      totalTradeReviews: categorized.tradeReviews.length,
      totalWeeklyOutlooks: categorized.weeklyOutlooks.length,
      totalWeeklyForecasts: categorized.weeklyForecasts.length
    };

    console.log(`✅ Categorization completed!`);
    console.log(`📊 Category breakdown:`);
    console.log(`   - Live Streams: ${categorized.liveStreams.length}`);
    console.log(`   - Trade Reviews: ${categorized.tradeReviews.length}`);
    console.log(`   - Weekly Outlooks: ${categorized.weeklyOutlooks.length}`);
    console.log(`   - Weekly Forecasts: ${categorized.weeklyForecasts.length}`);
    console.log(`   - Total videos after categorization: ${summary.totalVideos}`);

    // Log sample categorized videos
    console.log(`📝 Sample categorized videos:`);
    Object.entries(categorized).forEach(([category, videos]) => {
      const vidArray = videos as any[];
      if (vidArray.length > 0) {
        console.log(`   ${category}: "${vidArray[0].title}" (${vidArray[0].youtubeId})`);
      }
    });

    const responseData = {
      success: true,
      data: {
        categories: categorized,
        summary,
        requestedChannelId: channelId
      },
      meta: {
        userId: user.id,
        limit,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`🎯 === FINAL RESPONSE ===`);
    console.log(`✅ Success: ${responseData.success}`);
    console.log(`📈 Total videos in response: ${responseData.data.summary.totalVideos}`);
    console.log(`📁 Categories returned:`, Object.keys(responseData.data.categories));
    console.log(`🔗 Requested channel ID: ${responseData.data.requestedChannelId}`);
    console.log(`🏁 === REQUEST COMPLETED ===`);

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Channel videos fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel videos', details: error?.message },
      { status: 500 }
    );
  }
}
