const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { streams, channels } = require('./src/lib/schema.js');

const sqlite = new Database('./src/lib/sqlite.db');
const db = drizzle(sqlite);

console.log('=== CHECKING CHANNELS ===');
try {
  const allChannels = db.select().from(channels).all();
  console.log(`Total channels in DB: ${allChannels.length}`);

  // Look for inner circle trader
  const ictChannel = allChannels.find(ch =>
    ch.channelTitle.toLowerCase().includes('inner circle') ||
    ch.youtubeChannelId.toLowerCase().includes('circle')
  );

  if (ictChannel) {
    console.log('Found Inner Circle Trader channel:', ictChannel);
    console.log('\n=== VIDEOS FOR INNER CIRCLE TRADER ===');

    const channelVideos = db.select().from(streams).where(sql`${streams.channelId} = ${ictChannel.id}`).all();
    console.log(`Found ${channelVideos.length} videos:`);

    channelVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   YouTube ID: ${video.youtubeId}`);
      console.log(`   Created: ${video.createdAt}`);
      console.log(`   Live: ${video.isLive}`);
      console.log('---');
    });
  } else {
    console.log('Inner Circle Trader channel not found. Available channels:');
    allChannels.slice(0, 3).forEach(ch => {
      console.log(`- ${ch.channelTitle} (${ch.youtubeChannelId})`);
    });
  }

  console.log('\n=== ALL VIDEOS IN DB ===');
  const allVideos = db.select().from(streams).all();
  console.log(`Total videos in database: ${allVideos.length}`);

  const recentVideos = allVideos.slice(0, 5);
  console.log('Most recent 5 videos:');
  recentVideos.forEach((video, index) => {
    console.log(`${index + 1}. ${video.title} (${new Date(video.createdAt).toDateString()})`);
  });

} catch (error) {
  console.error('Error:', error);
}

sqlite.close();
