import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { channels, channelSubscriptions, processingQueue, streams } from './schema';
import { getChannelVideos, getVideoType, parseDuration } from './youtube';

/**
 * Discover and store new streams for a specific user
 */
export async function discoverStreamsForUser(userId: string) {
  try {
    // Get all channels the user is subscribed to
    const subscriptions = await db
      .select({
        channelId: channelSubscriptions.channelId,
        youtubeChannelId: channels.youtubeChannelId,
        trackingPreferences: channelSubscriptions.trackingPreferences,
      })
      .from(channelSubscriptions)
      .innerJoin(channels, eq(channels.id, channelSubscriptions.channelId))
      .where(eq(channelSubscriptions.userId, userId));

    if (subscriptions.length === 0) {
      console.log(`No channel subscriptions found for user ${userId}`);
      return { processedChannels: 0, newStreams: 0 };
    }

    let newStreamsCount = 0;
    let processedChannels = 0;

    for (const subscription of subscriptions) {
      try {
        if (!subscription.youtubeChannelId || !subscription.channelId) {
          console.log(`Skipping subscription with missing channel data for user ${userId}`);
          continue;
        }

        console.log(`Processing channel ${subscription.youtubeChannelId} for user ${userId}`);
        processedChannels++;

        // Get recent videos from the channel (last 24 hours worth)
        const videos = await getChannelVideos(subscription.youtubeChannelId, 25);

        const newVideos = [];
        for (const video of videos) {
          // Skip videos without valid ID
          if (!video.id) continue;

          // Check if stream already exists for this user
          const existingStream = await db
            .select()
            .from(streams)
            .where(
              and(
                eq(streams.userId, userId),
                eq(streams.youtubeId, video.id)
              )
            )
            .limit(1);

          if (existingStream.length > 0) {
            continue; // Already exists
          }

          // Filter based on user preferences
          const preferences = subscription.trackingPreferences as any;
          const streamType = getVideoType(video);

          if (!preferences.content_types.includes(streamType)) {
            continue; // Not interested in this type
          }

          // Calculate duration in seconds
          const durationSec = video.contentDetails?.duration ? parseDuration(video.contentDetails.duration) : 0;

          // Create new stream record
          const streamData = {
            userId,
            channelId: subscription.channelId as string,
            youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
            youtubeId: video.id,
            title: video.snippet?.title || '',
            description: video.snippet?.description || '',
            durationSeconds: durationSec,
            viewCount: parseInt(String(video.statistics?.viewCount || 0), 10),
            likeCount: parseInt(String(video.statistics?.likeCount || 0), 10),
            status: 'pending' as const,
            streamType,
            isLive: streamType === 'live',
          };

          newVideos.push(streamData);
        }

        // Insert new streams in batch
        if (newVideos.length > 0) {
          const insertedStreams = await db.insert(streams).values(newVideos).returning();

          // Add to processing queue
          const queueItems = insertedStreams.map((stream: any) => ({
            streamId: stream.id!,
            userId: userId!,
            priority: (stream.streamType! === 'live' ? 3 : 1),
            status: 'queued' as const,
          }));

          await db.insert(processingQueue) // @ts-ignore - Drizzle type inference issue
            .values(queueItems);
          newStreamsCount += insertedStreams.length;
        }

      } catch (error) {
        console.error(`Error processing channel ${subscription.youtubeChannelId}:`, error);
        // Continue with other channels
      }
    }

    return { processedChannels, newStreams: newStreamsCount };
  } catch (error) {
    console.error('Error discovering streams for user:', error);
    throw error;
  }
}

/**
 * Discover streams for all active users (for cron jobs)
 */
export async function discoverAllUserStreams() {
  try {
    // Get all unique user IDs with channel subscriptions
    const usersWithSubscriptions = await db
      .selectDistinct({ userId: channelSubscriptions.userId })
      .from(channelSubscriptions);

    let totalProcessedChannels = 0;
    let totalNewStreams = 0;

    for (const { userId } of usersWithSubscriptions) {
      try {
        if (!userId) {
          console.log('Skipping user with null userId');
          continue;
        }
        const result = await discoverStreamsForUser(userId);
        totalProcessedChannels += result.processedChannels;
        totalNewStreams += result.newStreams;
      } catch (error) {
        console.error(`Failed to discover streams for user ${userId}:`, error);
      }
    }

    return { totalProcessedChannels, totalNewStreams };
  } catch (error) {
    console.error('Error discovering all user streams:', error);
    throw error;
  }
}
