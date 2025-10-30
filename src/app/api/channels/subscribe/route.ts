import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { db } from '@/lib/db';
import { channels, channelSubscriptions, streams } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { google } from 'googleapis';

/**
 * POST /api/channels/subscribe - Subscribe to a single YouTube channel
 * DELETE /api/channels/subscribe?channelId=... - Unsubscribe from a channel
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
    const { channelId } = body;

    if (!channelId || typeof channelId !== 'string' || !channelId.trim()) {
      return NextResponse.json(
        { error: 'YouTube Channel ID is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const trimmedChannelId = channelId.trim();
    console.log(`User ${user.id} subscribing to channel ${trimmedChannelId}`);

    // Check if channel already exists in database
    console.log('Checking if channel exists in database...');
    const existingChannel = await db
      .select()
      .from(channels)
      .where(eq(channels.youtubeChannelId, trimmedChannelId))
      .limit(1);

    let channelDbId: string;
    let channelTitle: string;

    if (existingChannel.length > 0) {
      console.log('Channel exists, using existing record');
      channelDbId = existingChannel[0].id;
      channelTitle = existingChannel[0].channelTitle;
    } else {
      // Need to fetch channel details from YouTube API
      console.log('Channel not in database, fetching from YouTube API...');

      // Initialize YouTube API client
      const youtube = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY,
      });

      try {
        const channelResponse = await youtube.channels.list({
          part: ['snippet', 'statistics'],
          id: [trimmedChannelId],
        });

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
          console.log(`Channel ${trimmedChannelId} not found on YouTube`);
          return NextResponse.json(
            { error: 'Channel not found on YouTube. Please check the channel ID.' },
            { status: 404 }
          );
        }

        const channel = channelResponse.data.items[0];
        const actualChannelId = channel.id || trimmedChannelId;

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

        console.log(`Storing channel: ${channelData.channelTitle}`);
        const storedChannel = await db.insert(channels).values(channelData).returning();
        channelDbId = storedChannel[0].id;
        channelTitle = channelData.channelTitle;

      } catch (apiError: any) {
        console.error('YouTube API error:', apiError?.message);
        return NextResponse.json(
          { error: 'Failed to fetch channel information from YouTube. Please check your API key and try again.' },
          { status: 502 }
        );
      }
    }

    // Check if user is already subscribed
    console.log('Checking existing subscription...');
    const existingSubscription = await db
      .select()
      .from(channelSubscriptions)
      .where(and(eq(channelSubscriptions.userId, user.id), eq(channelSubscriptions.channelId, channelDbId)))
      .limit(1);

    if (existingSubscription.length > 0) {
      console.log(`User ${user.id} is already subscribed to ${channelTitle}`);
      return NextResponse.json(
        { error: 'Already subscribed to this channel', channelTitle },
        { status: 409 }
      );
    }

    // Create subscription
    console.log(`Creating subscription for user ${user.id} to channel ${channelTitle}`);
    await db.insert(channelSubscriptions).values({
      userId: user.id,
      channelId: channelDbId,
      isFavorite: false,
    });

    // Optionally get latest video and store it
    try {
      console.log('Attempting to fetch and store latest video...');
      const youtube = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY,
      });

      const videoResponse = await youtube.search.list({
        part: ['snippet'],
        channelId: trimmedChannelId,
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

          console.log(`Storing latest video: ${streamData.title}`);
          await db.insert(streams).values(streamData);
        }
      }
    } catch (videoError: any) {
      // Don't fail the subscription if video fetch fails
      console.log(`Warning: Could not fetch video for channel ${trimmedChannelId}:`, videoError?.message);
    }

    console.log(`✅ Successfully subscribed user ${user.id} to channel ${channelTitle}`);

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${channelTitle}`,
      data: {
        channelId: trimmedChannelId,
        channelTitle,
        subscribedAt: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error('Subscribe API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while subscribing to channel', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId || typeof channelId !== 'string' || !channelId.trim()) {
      return NextResponse.json(
        { error: 'YouTube Channel ID is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const trimmedChannelId = channelId.trim();
    console.log(`User ${user.id} unsubscribing from channel ${trimmedChannelId}`);

    // Find the channel in database
    const existingChannel = await db
      .select()
      .from(channels)
      .where(eq(channels.youtubeChannelId, trimmedChannelId))
      .limit(1);

    if (existingChannel.length === 0) {
      console.log(`Channel ${trimmedChannelId} not found in database`);
      return NextResponse.json(
        { error: 'Channel not found. You may not be subscribed to this channel.' },
        { status: 404 }
      );
    }

    const channelDbId = existingChannel[0].id;
    const channelTitle = existingChannel[0].channelTitle;

    // Check if user is subscribed
    const existingSubscription = await db
      .select()
      .from(channelSubscriptions)
      .where(and(eq(channelSubscriptions.userId, user.id), eq(channelSubscriptions.channelId, channelDbId)))
      .limit(1);

    if (existingSubscription.length === 0) {
      console.log(`User ${user.id} is not subscribed to ${channelTitle}`);
      return NextResponse.json(
        { error: 'You are not subscribed to this channel' },
        { status: 404 }
      );
    }

    // Remove subscription
    await db
      .delete(channelSubscriptions)
      .where(and(eq(channelSubscriptions.userId, user.id), eq(channelSubscriptions.channelId, channelDbId)));

    console.log(`✅ Successfully unsubscribed user ${user.id} from channel ${channelTitle}`);

    return NextResponse.json({
      success: true,
      message: `Successfully unsubscribed from ${channelTitle}`,
      data: {
        channelId: trimmedChannelId,
        channelTitle,
        unsubscribedAt: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error('Unsubscribe API error:', error);
    return NextResponse.json(
      { error: 'Internal server error while unsubscribing from channel', details: error?.message },
      { status: 500 }
    );
  }
}
