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
      // For development/testing, return empty subscriptions instead of auth error
      return NextResponse.json({
        success: true,
        data: {
          subscriptions: [],
          summary: {
            totalSubscribed: 0,
            favoritesCount: 0,
            activeSubscriptions: 0,
            totalAnalyzed: 0
          },
          meta: {
            userId: null,
            fetchedAt: new Date().toISOString(),
            includeStats: false,
            note: 'No authenticated user - returning empty subscriptions'
          }
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('stats') === 'true';

    // Fetch user's subscriptions from database with full channel profile data
    const userSubscriptions = await db.select({
      // Subscription data
      id: channelSubscriptions.id,
      channelId: channelSubscriptions.channelId,
      subscribedAt: channelSubscriptions.subscribedAt,
      isFavorite: channelSubscriptions.isFavorite,
      preferences: channelSubscriptions.trackingPreferences,

      // Channel profile data
      youtubeChannelId: channels.youtubeChannelId,
      title: channels.channelTitle,
      description: channels.channelDescription,
      customUrl: channels.customUrl,
      profileImageUrl: channels.profileImageUrl,
      country: channels.country,
      viewCount: channels.viewCount,
      subscriberCount: channels.subscriberCount,
      videoCount: channels.videoCount,
      isVerified: channels.isVerified,
      lastUpdated: channels.lastUpdated,
      createdAt: channels.createdAt,
    })
    .from(channelSubscriptions)
    .innerJoin(channels, eq(channelSubscriptions.channelId, channels.id))
    .where(eq(channelSubscriptions.userId, user.id))
    .orderBy(desc(channelSubscriptions.isFavorite), desc(channelSubscriptions.subscribedAt));

    // Transform subscriptions to match API response format with full profile data
    const subscriptions = userSubscriptions.map(sub => ({
      id: sub.id,
      channelId: sub.channelId,
      youtubeChannelId: sub.youtubeChannelId,
      title: sub.title || 'Unknown Channel',
      description: sub.description || 'Trading education channel',
      customUrl: sub.customUrl,
      country: sub.country,
      subscribers: sub.subscriberCount?.toString() || '0',
      viewCount: sub.viewCount?.toString() || '0',
      videoCount: sub.videoCount?.toString() || '0',
      thumbnail: sub.profileImageUrl || null,
      isVerified: sub.isVerified,
      subscribedAt: sub.subscribedAt ? sub.subscribedAt.toISOString() : new Date().toISOString(),
      isFavorite: sub.isFavorite,
      lastActivity: sub.subscribedAt ? sub.subscribedAt.toISOString() : new Date().toISOString(), // TODO: Update when we track last activity
      lastUpdated: sub.lastUpdated ? sub.lastUpdated.toISOString() : null,
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

    // Sort by favorites first, then by view count (most views = highest rank), then by subscription date
    const sortedSubscriptions = enrichedSubscriptions.sort((a, b) => {
      // Favorites first
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      // Then by view count (highest first)
      const aViews = parseInt(a.viewCount) || 0;
      const bViews = parseInt(b.viewCount) || 0;
      if (aViews !== bViews) return bViews - aViews;

      // Finally by subscription date (newest first)
      const aDate = new Date(a.subscribedAt).getTime();
      const bDate = new Date(b.subscribedAt).getTime();
      return bDate - aDate;
    });

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
