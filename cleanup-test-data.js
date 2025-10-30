#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const schema = require('./src/lib/schema.js');
const { eq, or, like } = require('drizzle-orm');

require('dotenv').config({ path: './.env.local' });

const sqlConnection = neon(process.env.DATABASE_URL);
const db = drizzle(sqlConnection, { schema });

async function cleanupTestData() {
  console.log('🧹 CLEANUP START: Removing test data...\n');

  try {
    // 1. Remove any channels with fake/incorrect YouTube IDs (like the fake Inner Circle Trader)
    console.log('📺 Cleaning up channels with fake/incorrect YouTube IDs...');
    const channelDeletes = await db.delete(schema.channels).where(
      or(
        like(schema.channels.youtubeChannelId, 'UCCvAyFxcccc%'),  // Fake Inner Circle Trader
        eq(schema.channels.youtubeChannelId, ''),  // Empty IDs
        eq(schema.channels.youtubeChannelId, 'test'),  // Test entries
      )
    );

    // 2. Remove any test videos/streams
    console.log('🎬 Cleaning up test streams/videos...');
    const streamDeletes = await db.delete(schema.streams).where(
      or(
        like(schema.streams.title, 'Test Video%'),
        like(schema.streams.title, 'Demo%'),
        like(schema.streams.title, 'TEST%'),
      )
    );

    // 3. Remove orphaned channel_subscriptions
    console.log('🔗 Removing orphaned channel subscriptions...');
    const subscriptionCleanup = await db.execute(`
      DELETE FROM channel_subscriptions
      WHERE "channelId" NOT IN (SELECT id FROM channels)
    `);

    // 4. Log cleanup summary
    console.log('\n📊 CLEANUP SUMMARY:');
    console.log('✅ Removed test channels');
    console.log('✅ Removed test videos');
    console.log('✅ Cleaned orphaned subscriptions');

    console.log('\n🎯 Next steps:');
    console.log('1. Use proper YouTube channel IDs when adding channels');
    console.log('2. Run stream discovery for real channels');
    console.log('3. Tutelage will show real YouTube videos');

    console.log('\n🏁 CLEANUP COMPLETE');

  } catch (error) {
    console.error('💥 Cleanup error:', error);
    process.exit(1);
  }
}

cleanupTestData().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
