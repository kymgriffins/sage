// Channel Subscription Management API
// POST /api/channels/subscribe - Subscribe to channel
// DELETE /api/channels/subscribe?channelId=UC123 - Unsubscribe from channel
// PUT /api/channels/subscribe - Update subscription preferences (favorites, settings)

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { db } from '@/lib/db';
import { channels, channelSubscriptions } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Helper function to ensure a channel exists in the database
 * If not found, fetches it from YouTube API and creates it
 */
async function ensureChannelExists(channelId: string): Promise<string> {
  try {
    // Check if channel already exists
    const existingChannel = await db
      .select({ id: channels.id })
      .from(channels)
      .where(eq(channels.youtubeChannelId, channelId))
      .limit(1);

    if (existingChannel.length > 0) {
      return existingChannel[0].id;
    }

    // Channel doesn't exist, fetch from YouTube API
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key not available for channel lookup');
    }

    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
    const response = await fetch(channelUrl);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.items?.length) {
      throw new Error('Channel not found on YouTube');
    }

    const youtubeChannel = data.items[0];

    // Insert new channel into database
    const newChannel = await db.insert(channels).values({
      youtubeChannelId: channelId,
      channelTitle: youtubeChannel.snippet.title,
      channelDescription: youtubeChannel.snippet.description,
      customUrl: youtubeChannel.snippet.customUrl,
      profileImageUrl: youtubeChannel.snippet.thumbnails?.default?.url,
      country: youtubeChannel.snippet.country,
      viewCount: parseInt(youtubeChannel.statistics.viewCount) || 0,
      subscriberCount: parseInt(youtubeChannel.statistics.subscriberCount) || 0,
      videoCount: parseInt(youtubeChannel.statistics.videoCount) || 0,
      isVerified: false, // Could be enhanced to check verification status
    }).returning({ id: channels.id });

    return newChannel[0].id;

  } catch (error) {
    console.error('Channel lookup error:', error);
    throw new Error(`Failed to ensure channel exists: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { channelId, settings } = await request.json();

    if (!channelId) {
      return NextResponse.json(
        { error: 'YouTube Channel ID is required' },
        { status: 400 }
      );
    }

    // Ensure channel exists in database (creates if not found)
    const dbChannelId = await ensureChannelExists(channelId);

    // Check if user is already subscribed
    const existingSubscription = await db
      .select()
      .from(channelSubscriptions)
      .where(
        and(
          eq(channelSubscriptions.userId, user.id),
          eq(channelSubscriptions.channelId, dbChannelId)
        )
      )
      .limit(1);

    if (existingSubscription.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Already subscribed to this channel',
        data: {
          channelId: channelId,
          userId: user.id,
          subscribed: true
        }
      }, { status: 409 }); // Conflict status
    }

    // Default subscription settings
    const defaultSettings = {
      content_types: ["live", "uploads"],
      notification_settings: {
        live_start: true,
        analysis_complete: true,
        key_insights: false
      },
      processing_modes: {
        real_time: true,
        post_stream: true,
        batch: false
      }
    };

    const finalSettings = { ...defaultSettings, ...settings };

    // Insert subscription into database
    const newSubscription = await db.insert(channelSubscriptions).values({
      userId: user.id,
      channelId: dbChannelId,
      trackingPreferences: finalSettings,
    }).returning({
      id: channelSubscriptions.id,
      userId: channelSubscriptions.userId,
      channelId: channelSubscriptions.channelId,
      trackingPreferences: channelSubscriptions.trackingPreferences,
      subscribedAt: channelSubscriptions.subscribedAt
    });

    const subscription = newSubscription[0];

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        channelId: channelId,
        userId: user.id,
        settings: subscription.trackingPreferences,
        subscribed: true,
        subscribedAt: subscription.subscribedAt
      },
      message: 'Successfully subscribed to channel'
    });

  } catch (error) {
    console.error('Subscription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Provide user-friendly error messages
    if (errorMessage.includes('YouTube API')) {
      return NextResponse.json({
        success: false,
        error: 'Channel verification failed - check channel ID or try again later',
        details: 'Unable to verify channel with YouTube API'
      }, { status: 503 });
    }

    if (errorMessage.includes('Channel not found')) {
      return NextResponse.json({
        success: false,
        error: 'Channel not found - please check the channel ID',
        details: 'The provided channel ID does not exist on YouTube'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to subscribe to channel',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json(
        { error: 'YouTube Channel ID is required' },
        { status: 400 }
      );
    }

    // Find the channel in our database by YouTube channel ID
    const dbChannel = await db
      .select({ id: channels.id, channelTitle: channels.channelTitle })
      .from(channels)
      .where(eq(channels.youtubeChannelId, channelId))
      .limit(1);

    if (dbChannel.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Channel not found - you may not be subscribed to this channel',
        data: { channelId, userId: user.id }
      }, { status: 404 });
    }

    const dbChannelId = dbChannel[0].id;
    const channelTitle = dbChannel[0].channelTitle;

    // Check if subscription exists
    const existingSubscription = await db
      .select()
      .from(channelSubscriptions)
      .where(
        and(
          eq(channelSubscriptions.userId, user.id),
          eq(channelSubscriptions.channelId, dbChannelId)
        )
      )
      .limit(1);

    if (existingSubscription.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Not subscribed to "${channelTitle}"`,
        data: {
          channelId,
          userId: user.id,
          subscribed: false
        }
      }, { status: 404 });
    }

    // Delete the subscription
    await db.delete(channelSubscriptions)
      .where(
        and(
          eq(channelSubscriptions.userId, user.id),
          eq(channelSubscriptions.channelId, dbChannelId)
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: existingSubscription[0].id,
        channelId,
        channelTitle,
        userId: user.id,
        subscribed: false,
        unsubscribedAt: new Date().toISOString()
      },
      message: `Successfully unsubscribed from "${channelTitle}"`
    });

  } catch (error) {
    console.error('Unsubscription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: 'Failed to unsubscribe from channel',
      details: errorMessage
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { channelId, settings, isFavorite } = await request.json();

    if (!channelId) {
      return NextResponse.json(
        { error: 'YouTube Channel ID is required' },
        { status: 400 }
      );
    }

    // Validation
    if (!settings && isFavorite === undefined) {
      return NextResponse.json(
        { error: 'Settings object or isFavorite flag is required' },
        { status: 400 }
      );
    }

    // Find the channel in our database
    const dbChannel = await db
      .select({ id: channels.id, channelTitle: channels.channelTitle })
      .from(channels)
      .where(eq(channels.youtubeChannelId, channelId))
      .limit(1);

    if (dbChannel.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Channel not found - not subscribed to this channel',
        data: { channelId, userId: user.id }
      }, { status: 404 });
    }

    const dbChannelId = dbChannel[0].id;
    const channelTitle = dbChannel[0].channelTitle;

    // Check if subscription exists
    const existingSubscription = await db
      .select()
      .from(channelSubscriptions)
      .where(
        and(
          eq(channelSubscriptions.userId, user.id),
          eq(channelSubscriptions.channelId, dbChannelId)
        )
      )
      .limit(1);

    if (existingSubscription.length === 0) {
      return NextResponse.json({
        success: false,
        error: `Not subscribed to "${channelTitle}"`,
        data: { channelId, userId: user.id }
      }, { status: 404 });
    }

    // Prepare update object
    const updateData: any = {};

    if (settings) {
      // Validate settings structure
      if (typeof settings !== 'object') {
        return NextResponse.json({
          success: false,
          error: 'Settings must be an object',
          data: { channelId, userId: user.id }
        }, { status: 400 });
      }

      // Merge with existing settings
      const currentSettings = existingSubscription[0].trackingPreferences || {};
      updateData.trackingPreferences = { ...currentSettings, ...settings };
    }

    if (isFavorite !== undefined) {
      updateData.isFavorite = Boolean(isFavorite);
    }

    // Perform the update
    const updatedSubscription = await db.update(channelSubscriptions)
      .set(updateData)
      .where(
        and(
          eq(channelSubscriptions.userId, user.id),
          eq(channelSubscriptions.channelId, dbChannelId)
        )
      )
      .returning({
        id: channelSubscriptions.id,
        userId: channelSubscriptions.userId,
        channelId: channelSubscriptions.channelId,
        trackingPreferences: channelSubscriptions.trackingPreferences,
        isFavorite: channelSubscriptions.isFavorite,
        subscribedAt: channelSubscriptions.subscribedAt
      });

    const subscription = updatedSubscription[0];

    // Prepare response message
    let message = 'Subscription preferences updated';
    if (settings && !updateData.isFavorite !== undefined) {
      message = 'Notification settings updated';
    } else if (updateData.isFavorite !== undefined) {
      message = subscription.isFavorite ? `Added "${channelTitle}" to favorites` : `Removed "${channelTitle}" from favorites`;
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        channelId,
        channelTitle,
        userId: user.id,
        settings: subscription.trackingPreferences,
        isFavorite: subscription.isFavorite,
        updatedAt: new Date().toISOString()
      },
      message
    });

  } catch (error) {
    console.error('Subscription update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: 'Failed to update subscription preferences',
      details: errorMessage
    }, { status: 500 });
  }
}
