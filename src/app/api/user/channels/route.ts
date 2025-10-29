// User Channels API
// GET /api/user/channels - Get user's subscribed channels and favorites

import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { db } from '@/lib/db';
import { channelSubscriptions, channels } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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
    const includeStats = searchParams.get('stats') === 'true';

    // Fetch user's subscriptions from database
    const userSubscriptions = await db.select({
      id: channelSubscriptions.id,
      channelId: channelSubscriptions.channelId,
      youtubeChannelId: channels.youtubeChannelId,
      title: channels.channelTitle,
      description: channels.channelDescription,
      subscribers: channels.subscriberCount,
      thumbnail: channels.profileImageUrl,
      subscribedAt: channelSubscriptions.subscribedAt,
      isFavorite: channelSubscriptions.isFavorite,
      preferences: channelSubscriptions.trackingPreferences,
    })
    .from(channelSubscriptions)
    .innerJoin(channels, eq(channelSubscriptions.channelId, channels.id))
    .where(eq(channelSubscriptions.userId, user.id))
    .orderBy(desc(channelSubscriptions.isFavorite), desc(channelSubscriptions.subscribedAt));

    // Transform subscriptions to match API response format
    const subscriptions = userSubscriptions.map(sub => ({
      id: sub.id,
      channelId: sub.channelId,
      youtubeChannelId: sub.youtubeChannelId,
      title: sub.title || 'Unknown Channel',
      description: sub.description || 'Trading education channel',
      subscribers: sub.subscribers?.toString() || '0',
      thumbnail: sub.thumbnail || null,
      subscribedAt: sub.subscribedAt ? sub.subscribedAt.toISOString() : new Date().toISOString(),
      isFavorite: sub.isFavorite,
      lastActivity: sub.subscribedAt ? sub.subscribedAt.toISOString() : new Date().toISOString(), // TODO: Update when we track last activity
      analysisCount: 0, // TODO: Implement real analytics
      status: "active", // TODO: Add subscription status support
      preferences: sub.preferences || {}
    }));

    let enrichedSubscriptions = subscriptions;

    // Add additional stats if requested
    if (includeStats) {
      // TODO: Enrich with real analytics data
      enrichedSubscriptions = subscriptions.map(sub => ({
        ...sub,
        stats: {
          recentAnalyses: Math.floor(Math.random() * 20),
          averageRelevance: Math.floor(Math.random() * 40 + 60), // 60-100%
          lastWeekActivity: Math.floor(Math.random() * 50),
          totalViews: parseInt(sub.subscribers) * Math.floor(Math.random() * 10 + 1)
        }
      }));
    }

    // Already sorted by the database query (favorites first, then by subscription date)
    const sortedSubscriptions = enrichedSubscriptions;
    const favoriteCount = sortedSubscriptions.filter(s => s.isFavorite).length;

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: sortedSubscriptions,
        summary: {
          totalSubscribed: sortedSubscriptions.length,
          favoritesCount: favoriteCount,
          activeSubscriptions: sortedSubscriptions.filter(s => s.status === 'active').length,
          totalAnalyzed: sortedSubscriptions.reduce((sum, s) => sum + s.analysisCount, 0)
        },
        meta: {
          userId: user.id,
          fetchedAt: new Date().toISOString(),
          includeStats
        }
      }
    });

  } catch (error) {
    console.error('User channels fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user channels' },
      { status: 500 }
    );
  }
}
