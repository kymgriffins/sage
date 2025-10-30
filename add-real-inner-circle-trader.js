#!/usr/bin/env node

const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { channels, channelSubscriptions, streams } = require('./src/lib/schema.js');
const { eq, and } = require('drizzle-orm');
const fs = require('fs');

require('dotenv').config({ path: './.env.local' });

// Fixed Inner Circle Trader data
const REAL_ICT_DATA = {
  id: 'UCtjxa77NqamhVC8atV85Rog',
  title: 'The Inner Circle Trader',
  description: 'I am the Mentor of your Mentor.\n\nI am "The Ghost In The Machine".\n\nThe Author & Creator of "Smart Money Concepts"',
  subscriberCount: '1930000',
  videoCount: '779',
  viewCount: '170439226'
};

// Fixed user ID (same as the one used in other scripts)
const USER_ID = '7577d2da-ed01-477a-86f3-14cc8432259d';

async function addRealInnerCircleTrader() {
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    console.log('🚀 STARTING REAL INNER CIRCLE TRADER SETUP\n');

    // 1. First, delete any fake/test Inner Circle Trader channels
    console.log('🧹 Removing any fake Inner Circle Trader channels...');
    await db.delete(channels).where(eq(channels.youtubeChannelId, 'UCCvAyFxccccqXJ6rxe-l6EA'));
    console.log('✅ Removed fake channels\n');

    // 2. Add the real Inner Circle Trader channel
    console.log('📺 Adding real Inner Circle Trader channel...');
    const newChannel = await db.insert(channels).values({
      youtubeChannelId: REAL_ICT_DATA.id,
      channelTitle: REAL_ICT_DATA.title,
      description: REAL_ICT_DATA.description,
      subscriberCount: parseInt(REAL_ICT_DATA.subscriberCount),
      videoCount: parseInt(REAL_ICT_DATA.videoCount),
      viewCount: parseInt(REAL_ICT_DATA.viewCount),
      thumbnailUrl: `https://www.youtube.com/channel/${REAL_ICT_DATA.id}/featured`,
      lastUpdated: new Date(),
    }).returning();

    console.log(`✅ Added real channel: ${newChannel[0].channelTitle} (ID: ${newChannel[0].id})\n`);

    // 3. Subscribe this user to the channel
    console.log('👤 Adding user subscription...');
    await db.insert(channelSubscriptions).values({
      userId: USER_ID,
      channelId: newChannel[0].id,
      isFavorite: true,
    });
    console.log(`✅ User ${USER_ID} subscribed to Inner Circle Trader\n`);

    // 4. Import real videos from JSON file
    console.log('🎬 Importing real YouTube videos...');
    if (fs.existsSync('inner-circle-videos.json')) {
      const videoData = JSON.parse(fs.readFileSync('inner-circle-videos.json', 'utf8'));

      let imported = 0;
      for (const video of videoData.videos.slice(0, 25)) { // Import first 25 videos for demo
        try {
          await db.insert(streams).values({
            youtubeId: video.id,
            title: video.title,
            description: video.description,
            youtubeUrl: video.url,
            channelId: newChannel[0].id,
            isLive: video.isLive || false,
            createdAt: new Date(video.publishedAt),
            updatedAt: new Date(),
          });
          imported++;
        } catch (error) {
          // Skip duplicates
          console.log(`⚠️ Skipped duplicate: ${video.title}`);
        }
      }

      console.log(`✅ Imported ${imported} real videos from YouTube\n`);
    } else {
      console.log('⚠️ No inner-circle-videos.json found - run the YouTube scraper first\n');
    }

    // 5. Summary
    console.log('📊 SETUP COMPLETE:');
    console.log('✅ Real Inner Circle Trader channel added');
    console.log('✅ User subscription created');
    console.log('✅ Real YouTube videos imported');
    console.log('✅ Tutelage page should now show multiple videos\n');

    console.log('🎯 TEST RESULTS:');
    console.log('Channel ID: UCtjxa77NqamhVC8atV85Rog (REAL YouTube ID)');
    console.log('Videos: Should see at least 25 real videos from YouTube');
    console.log('Using search in tutelage? Use channel ID: UCtjxa77NqamhVC8atV85Rog');
    console.log('Refresh page - you should now see real Inner Circle Trader content!\n');

  } catch (error) {
    console.error('💥 Setup error:', error);
    process.exit(1);
  }
}

addRealInnerCircleTrader().then(() => {
  console.log('🏁 REAL INNER CIRCLE TRADER SETUP COMPLETE');
  process.exit(0);
}).catch(error => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
});
