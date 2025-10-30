import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { db } from '@/lib/db';
import { channels, channelSubscriptions } from '@/lib/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { google } from 'googleapis';

/**
 * POST /api/channels/refresh - Refresh channel data from YouTube
 * Body: { channelIds?: string[] } - Optional channel IDs to refresh, if not provided refreshes all user's channels
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

    console.log(`User ${user.id} refreshing channel data. Requested channel IDs:`, channelIds);

    // Initialize YouTube API client
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });

    let channelsToRefresh: any[];
    let queryType: string;

    if (channelIds && Array.isArray(channelIds) && channelIds.length > 0) {
      // Refresh specific channels - get channels that user has subscribed to AND are in the requested list
      queryType = 'specific';
      channelsToRefresh = await db
        .select({
          id: channels.id,
          youtubeChannelId: channels.youtubeChannelId,
          currentSubs: channels.subscriberCount,
          currentViews: channels.viewCount,
          currentVideos: channels.videoCount,
          channelTitle: channels.channelTitle,
        })
        .from(channels)
        .innerJoin(channelSubscriptions, eq(channels.id, channelSubscriptions.channelId))
        .where(and(eq(channelSubscriptions.userId, user.id), inArray(channels.youtubeChannelId, channelIds)));

      console.log(`Found ${channelsToRefresh.length} matching subscribed channels out of ${channelIds.length} requested`);
    } else {
      // Refresh all user's subscribed channels
      queryType = 'all user channels';
      channelsToRefresh = await db
        .select({
          id: channels.id,
          youtubeChannelId: channels.youtubeChannelId,
          currentSubs: channels.subscriberCount,
          currentViews: channels.viewCount,
          currentVideos: channels.videoCount,
          channelTitle: channels.channelTitle,
        })
        .from(channels)
        .innerJoin(channelSubscriptions, eq(channels.id, channelSubscriptions.channelId))
        .where(eq(channelSubscriptions.userId, user.id));

      console.log(`Refreshing all ${channelsToRefresh.length} subscribed channels`);
    }

    if (channelsToRefresh.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No channels to refresh',
        data: {
          refreshed: 0,
          skipped: 0,
          errors: 0
        }
      });
    }

    const results = {
      refreshed: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    // Process channels in batches to avoid YouTube API rate limits
    const batchSize = 50; // YouTube API allows up to 50 channels per request
    const batches = [];
    for (let i = 0; i < channelsToRefresh.length; i += batchSize) {
      batches.push(channelsToRefresh.slice(i, i + batchSize));
    }

    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} channels)`);

      try {
        // Get current data from YouTube
        const channelResponse = await youtube.channels.list({
          part: ['snippet', 'statistics'],
          id: batch.map(ch => ch.youtubeChannelId),
        });

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
          console.log(`Batch ${batchIndex + 1}: No channel data found`);
          results.errors += batch.length;
          batch.forEach(ch => results.details.push({
            channelId: ch.youtubeChannelId,
            title: ch.channelTitle,
            status: 'error',
            reason: 'Channel not found on YouTube'
          }));
          continue;
        }

        console.log(`Batch ${batchIndex + 1}: Retrieved current data for ${channelResponse.data.items.length} channels`);

        // Update each channel in database
        for (const youtubeChannel of channelResponse.data.items) {
          const channel = batch.find(ch => ch.youtubeChannelId === youtubeChannel.id);
          if (!channel) continue;

          try {
            const currentSubs = parseInt(youtubeChannel.statistics?.subscriberCount || '0');
            const currentViews = parseInt(youtubeChannel.statistics?.viewCount || '0');
            const currentVideos = parseInt(youtubeChannel.statistics?.videoCount || '0');

            // Check if data actually changed
            const subsChanged = currentSubs !== channel.currentSubs;
            const viewsChanged = currentViews !== channel.currentViews;
            const videosChanged = currentVideos !== channel.currentVideos;

            if (subsChanged || viewsChanged || videosChanged) {
              // Update database with fresh YouTube data
              await db.update(channels)
                .set({
                  subscriberCount: currentSubs,
                  viewCount: currentViews,
                  videoCount: currentVideos,
                  profileImageUrl: youtubeChannel.snippet?.thumbnails?.default?.url || channel.profileImageUrl,
                  country: youtubeChannel.snippet?.country || channel.country,
                  customUrl: youtubeChannel.snippet?.customUrl || channel.customUrl,
                  channelDescription: youtubeChannel.snippet?.description || channel.channelDescription,
                  lastUpdated: new Date(),
                })
                .where(eq(channels.id, channel.id));

              results.refreshed++;
              console.log(`✅ Updated ${channel.channelTitle}: subs ${channel.currentSubs} → ${currentSubs}, videos ${channel.currentVideos} → ${currentVideos}`);

              results.details.push({
                channelId: channel.youtubeChannelId,
                title: channel.channelTitle,
                status: 'refreshed',
                changes: {
                  subscribers: subsChanged ? { from: channel.currentSubs, to: currentSubs } : null,
                  views: viewsChanged ? { from: channel.currentViews, to: currentViews } : null,
                  videos: videosChanged ? { from: channel.currentVideos, to: currentVideos } : null
                }
              });
            } else {
              results.skipped++;
              console.log(`⏭️  No changes for ${channel.channelTitle} - data is up to date`);

              results.details.push({
                channelId: channel.youtubeChannelId,
                title: channel.channelTitle,
                status: 'no_changes',
                message: 'Data was already current'
              });
            }

          } catch (updateError: any) {
            console.error(`❌ Error updating channel ${channel.youtubeChannelId}:`, updateError?.message);
            results.errors++;
            results.details.push({
              channelId: channel.youtubeChannelId,
              title: channel.channelTitle,
              status: 'error',
              reason: updateError?.message || 'Database update failed'
            });
          }
        }

      } catch (batchError: any) {
        console.error(`❌ Batch ${batchIndex + 1} error:`, batchError?.message);
        results.errors += batch.length;
        batch.forEach(ch => results.details.push({
          channelId: ch.youtubeChannelId,
          title: ch.channelTitle,
          status: 'error',
          reason: `Batch API error: ${batchError?.message}`
        }));
      }

      // Add small delay between batches to be respectful to YouTube API
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
    }

    console.log(`Refresh complete: ${results.refreshed} updated, ${results.skipped} no changes, ${results.errors} errors`);

    return NextResponse.json({
      success: true,
      message: `Refreshed ${results.refreshed} channels (${results.skipped} up to date, ${results.errors} errors)`,
      data: {
        refreshed: results.refreshed,
        upToDate: results.skipped,
        errors: results.errors,
        queryType,
        timestamp: new Date().toISOString(),
        details: results.details
      },
      meta: {
        userId: user.id,
        requestedChannels: channelIds?.length || 'all',
        processedChannels: channelsToRefresh.length,
        batches: batches.length
      }
    });

  } catch (error: any) {
    console.error('Channel refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh channel data', details: error?.message },
      { status: 500 }
    );
  }
}
