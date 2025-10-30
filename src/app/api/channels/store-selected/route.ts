import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { db } from '@/lib/db';
import { channels, channelSubscriptions, streams } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { google } from 'googleapis';

/**
 * POST /api/channels/store-selected
 * Store selected YouTube channels for a user
 * Body: { channelIds: string[] }
 */

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { channelIds } = body;

    if (!channelIds || !Array.isArray(channelIds) || channelIds.length === 0) {
      return NextResponse.json(
        { error: 'channelIds array is required' },
        { status: 400 }
      );
    }

    console.log(`Storing ${channelIds.length} selected channels for user ${user.id}`);

    // Initialize YouTube API client
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });

    const storedChannels = [];

    for (const channelId of channelIds) {
      try {
        console.log(`Processing channel ${channelId}`);

        // Get detailed channel info from YouTube API
        const channelResponse = await youtube.channels.list({
          part: ['snippet', 'statistics'],
          id: [channelId],
        });

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
          console.log(`Channel ${channelId} not found`);
          continue;
        }

        const channel = channelResponse.data.items[0];

        // Use the ID from the API response (it might be different from the search)
        const actualChannelId = channel.id || channelId;

        if (!actualChannelId) {
          console.log(`No channel ID found for ${channelId}`);
          continue;
        }

        // Check if channel already exists
        const existingChannel = await db
          .select()
          .from(channels)
          .where(eq(channels.youtubeChannelId, actualChannelId))
          .limit(1);

        let channelDbId: string;

        if (existingChannel.length > 0) {
          console.log(`Channel ${actualChannelId} already exists, using existing record`);
          channelDbId = existingChannel[0].id;
        } else {
          // Store channel data
          const channelData = {
            youtubeChannelId: actualChannelId,
            channelTitle: channel.snippet?.title || '',
            channelDescription: channel.snippet?.description || '',
            customUrl: channel.snippet?.customUrl,
            profileImageUrl: channel.snippet?.thumbnails?.default?.url,
            country: channel.snippet?.country,
            viewCount: parseInt(channel.statistics?.viewCount || '0'),
            subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
            videoCount: parseInt(channel.statistics?.videoCount || '0'),
            isVerified: false,
          };

          const storedChannel = await db.insert(channels).values(channelData).returning();
          channelDbId = storedChannel[0].id;
          console.log(`✅ Stored new channel: ${channelData.channelTitle}`);
        }

        // Check if user subscription already exists
        const existingSubscription = await db
          .select()
          .from(channelSubscriptions)
          .where(and(eq(channelSubscriptions.userId, user.id), eq(channelSubscriptions.channelId, channelDbId)))
          .limit(1);

        if (existingSubscription.length > 0) {
          console.log(`User subscription already exists for channel ${channelId}`);
        } else {
          // Create subscription
          await db.insert(channelSubscriptions).values({
            userId: user.id,
            channelId: channelDbId,
            isFavorite: false,
          });
          console.log(`✅ Created subscription for user ${user.id} to channel ${channelId}`);

          // Get latest video and store it
          try {
            const videoResponse = await youtube.search.list({
              part: ['snippet'],
              channelId: actualChannelId,
              order: 'date',
              maxResults: 1,
              type: ['video'],
            });

            if (videoResponse.data.items && videoResponse.data.items.length > 0) {
              const video = videoResponse.data.items[0];
              const videoId = video.id?.videoId;

              if (videoId) {
                const streamData = {
                  userId: user.id,
                  channelId: channelDbId,
                  youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
                  youtubeId: videoId,
                  title: video.snippet?.title,
                  description: video.snippet?.description,
                };

                await db.insert(streams).values(streamData);
                console.log(`✅ Stored latest video: ${streamData.title}`);
              }
            }
          } catch (videoError: any) {
            console.log(`⚠️  Could not fetch video for channel ${actualChannelId}:`, videoError?.message || 'Unknown error');
          }
        }

        storedChannels.push({
          channelId: channelId,
          title: channel.snippet?.title,
          stored: true,
          dbId: channelDbId,
        });

      } catch (error: any) {
        console.error(`❌ Error storing channel ${channelId}:`, error?.message || 'Unknown error');
        storedChannels.push({
          channelId: channelId,
          title: 'Unknown',
          stored: false,
          error: error?.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        storedChannels,
        message: `Processed ${storedChannels.length} channels`
      },
      meta: {
        userId: user.id,
        requestTimestamp: new Date().toISOString(),
        totalRequested: channelIds.length,
        totalStored: storedChannels.filter(c => c.stored).length,
      }
    });

  } catch (error: any) {
    console.error('Store selected channels error:', error);
    return NextResponse.json(
      { error: 'Failed to store selected channels', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
