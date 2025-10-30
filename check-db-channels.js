const postgres = require('postgres');

require('dotenv').config();

// Check what's actually in the database
async function checkDatabase() {
  console.log('🔍 CHECKING DATABASE FOR INNER CIRCLE TRADER DATA\n');

  const client = postgres(process.env.DATABASE_URL);

  try {
    console.log('🏗️ Connecting to database...');

    // Check current channels table
    console.log('📺 Channels table:');
    const channels = await client`
      SELECT id, "youtubeChannelId", "channelTitle", "videoCount" FROM channels
      WHERE LOWER("channelTitle") LIKE '%circle%' OR LOWER("channelTitle") LIKE '%trader%'
      ORDER BY "createdAt" DESC LIMIT 10
    `;

    console.log(`Found ${channels.length} channels matching 'circle' or 'trader':`);
    channels.forEach(channel => {
      console.log(`- ID: ${channel.id} | YouTube: ${channel.youtubeChannelId} | Title: ${channel.channelTitle} | Videos: ${channel.videoCount}`);
    });

    console.log('');

    // Check streams table for any videos
    console.log('🎬 Videos in streams table:');
    const streams = await client`
      SELECT s.id, s."youtubeId", s.title, s."createdAt", c."channelTitle", c."youtubeChannelId"
      FROM streams s
      JOIN channels c ON s."channelId" = c.id
      WHERE LOWER(c."channelTitle") LIKE '%circle%' OR LOWER(c."channelTitle") LIKE '%trader%'
      ORDER BY s."createdAt" DESC LIMIT 10
    `;

    console.log(`Found ${streams.length} videos in database:`);
    streams.forEach(video => {
      console.log(`- "${video.title}" (${video.youtubeId}) | Channel: ${video.channelTitle}`);
    });

    console.log('');

    // What channel ID is stored vs what it should be
    console.log('🔍 REAL vs STORED CHANNEL ID:');
    console.log(`REAL (from YouTube):           UCtjxa77NqamhVC8atV85Rog`);
    if (channels.length > 0) {
      console.log(`STORED (in database):          ${channels[0].youtubeChannelId}`);
      console.log(`MATCH:                         ${channels[0].youtubeChannelId === 'UCtjxa77NqamhVC8atV85Rog' ? '✅ YES' : '❌ NO - WRONG CHANNEL ID!'}`);
    } else {
      console.log(`STORED (in database):          NONE FOUND`);
    }

    console.log('');

  } catch (error) {
    console.error('💥 Database check error:', error);
  } finally {
    await client.end();
  }
}

checkDatabase().then(() => {
  console.log('🏁 Database check complete');
}).catch(console.error);
