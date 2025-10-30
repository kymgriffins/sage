import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { channels, channelSubscriptions } from './src/lib/schema.js';
import { eq, and } from 'drizzle-orm';

// Create database connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// User ID from request
const USER_ID = '7577d2da-ed01-477a-86f3-14cc8432259d';

async function addSubscriptionsForExistingChannels(userId) {
  try {
    console.log(`Adding channel subscriptions for user ${userId}`);

    // Get all channels that don't have subscriptions for this user
    const existingChannels = await db
      .select({
        id: channels.id,
        channelTitle: channels.channelTitle,
        youtubeChannelId: channels.youtubeChannelId,
      })
      .from(channels);

    // Check each channel for subscriptions
    const channelsWithoutSubscriptions = [];
    for (const channel of existingChannels) {
      const existingSubscription = await db
        .select()
        .from(channelSubscriptions)
        .where(and(eq(channelSubscriptions.userId, userId), eq(channelSubscriptions.channelId, channel.id)))
        .limit(1);

      if (existingSubscription.length === 0) {
        channelsWithoutSubscriptions.push(channel);
      }
    }

    console.log(`Found ${channelsWithoutSubscriptions.length} channels without subscriptions`);

    let added = 0;
    for (const channel of channelsWithoutSubscriptions) {
      try {
        await db.insert(channelSubscriptions).values({
          userId,
          channelId: channel.id,
          isFavorite: Math.random() > 0.8,
        });
        console.log(`Added subscription for channel: ${channel.channelTitle}`);
        added++;
      } catch (error) {
        console.error(`Error adding subscription for channel ${channel.id}:`, error.message);
      }
    }

    console.log(`Added ${added} channel subscriptions`);
    return added;

  } catch (error) {
    console.error('Error adding subscriptions:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    // Check environment variables
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is required');
      process.exit(1);
    }

    const added = await addSubscriptionsForExistingChannels(USER_ID);

    console.log(`Subscription addition completed. Added ${added} subscriptions.`);
    process.exit(0);

  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

main();
