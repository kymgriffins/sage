import { google } from 'googleapis';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { channels, streams, channelSubscriptions } from './src/lib/schema.js';

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

// Create database connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// User ID from request
const USER_ID = '7577d2da-ed01-477a-86f3-14cc8432259d';

async function searchAndStoreChannels(query, userId) {
  try {
    console.log('========================================');
    console.log(`🔍 SEARCHING YouTube for channels: "${query}"`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`👤 User ID: ${userId}`);
    console.log('========================================');

    // Log the search API call
    console.log('📡 Making YouTube Search API call...');
    console.log('🔗 Endpoint: https://www.googleapis.com/youtube/v3/search');
    console.log('📋 Parameters:', {
      part: 'snippet',
      q: query,
      type: 'channel',
      maxResults: 5
    });

    const response = await youtube.search.list({
      part: 'snippet',
      q: query,
      type: 'channel',
      maxResults: 5, // Get top 5 results
    });

    console.log('✅ Search API Response received');
    console.log(`📊 Response Items Count: ${response.data.items?.length || 0}`);
    console.log('📄 Search Results Preview:', response.data.items?.slice(0, 3).map(item => ({
      channelId: item.id?.channelId,
      title: item.snippet?.title,
      description: item.snippet?.description?.substring(0, 100) + '...'
    })));

    if (!response.data.items || response.data.items.length === 0) {
      console.log('❌ No channels found for query:', query);
      console.log('========================================');
      return [];
    }

    console.log(`🎯 Found ${response.data.items.length} channel(s) from search`);

    // Get detailed channel info
    const channelIds = response.data.items
      .map(item => item.id?.channelId)
      .filter(id => id);

    console.log('🔄 Extracted Channel IDs:', channelIds);
    console.log('📡 Making YouTube Channels API call for detailed info...');
    console.log('🔗 Endpoint: https://www.googleapis.com/youtube/v3/channels');
    console.log('📋 Parameters:', {
      part: 'snippet,statistics',
      id: channelIds.join(',')
    });

    const channelsResponse = await youtube.channels.list({
      part: 'snippet,statistics',
      id: channelIds.join(','),
    });

    console.log('✅ Channels API Response received');
    console.log(`📊 Detailed Channel Items: ${channelsResponse.data.items?.length || 0}`);

    const storedChannels = [];

    console.log('🔄 Processing individual channels...');
    console.log('========================================');

    for (const [index, channel] of (channelsResponse.data.items || []).entries()) {
      console.log(`📺 Processing Channel ${index + 1}/${channelsResponse.data.items?.length || 0}`);
      console.log(`🔗 Channel ID: ${channel.id}`);
      console.log(`📛 Channel Title: ${channel.snippet?.title}`);
      console.log(`📊 Channel Stats: ${channel.statistics?.subscriberCount} subscribers, ${channel.statistics?.videoCount} videos`);

      try {
        const channelData = {
          youtubeChannelId: channel.id,
          channelTitle: channel.snippet?.title || '',
          channelDescription: channel.snippet?.description || '',
          customUrl: channel.snippet?.customUrl,
          profileImageUrl: channel.snippet?.thumbnails?.default?.url,
          country: channel.snippet?.country,
          viewCount: parseInt(channel.statistics?.viewCount || '0'),
          subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
          videoCount: parseInt(channel.statistics?.videoCount || '0'),
          isVerified: false, // Will need manual verification
        };

        console.log('💾 Preparing channel data for database:', {
          title: channelData.channelTitle,
          subscriberCount: channelData.subscriberCount,
          videoCount: channelData.videoCount,
          country: channelData.country
        });

        // Store in database
        console.log('🗄️  Inserting into channels table...');
        const storedChannel = await db.insert(channels).values(channelData).returning();

        console.log('✅ Channel stored successfully');
        console.log(`🆔 Database ID: ${storedChannel[0].id}`);

        // Also create a user channel subscription
        console.log('👤 Creating user channel subscription...');
        const isFavorite = Math.random() > 0.8;
        const subscriptionResult = await db.insert(channelSubscriptions).values({
          userId,
          channelId: storedChannel[0].id,
          isFavorite,
        });

        console.log(`✅ Channel subscription created (Favorite: ${isFavorite})`);

        storedChannels.push(storedChannel[0]);

        // Get sample video
        console.log('🎬 Fetching most recent video...');
        console.log('📡 Making YouTube Search API call for videos...');
        console.log('🔗 Endpoint: https://www.googleapis.com/youtube/v3/search');
        console.log('📋 Parameters:', {
          part: 'snippet',
          channelId: channel.id,
          order: 'date',
          maxResults: 1,
          type: 'video'
        });

        const videoResponse = await youtube.search.list({
          part: 'snippet',
          channelId: channel.id,
          order: 'date',
          maxResults: 1,
          type: 'video',
        });

        console.log('✅ Video search API response received');
        console.log(`📊 Videos found: ${videoResponse.data.items?.length || 0}`);

        if (videoResponse.data.items && videoResponse.data.items.length > 0) {
          const video = videoResponse.data.items[0];
          const videoId = video.id?.videoId;

          console.log(`🎥 Latest video: "${video.snippet?.title}"`);
          console.log(`🆔 Video ID: ${videoId}`);

          if (videoId) {
            const streamData = {
              userId,
              channelId: storedChannel[0].id,
              youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
              youtubeId: videoId,
              title: video.snippet?.title,
              description: video.snippet?.description,
            };

            console.log('🗄️  Inserting video into streams table...');
            const streamResult = await db.insert(streams).values(streamData);

            console.log(`✅ Stream stored successfully: "${streamData.title}"`);
            console.log(`🔗 YouTube URL: ${streamData.youtubeUrl}`);
          }
        } else {
          console.log('⚠️  No videos found for this channel');
        }

        console.log(`✅ Channel ${channel.snippet?.title} processing complete`);
        console.log('----------------------------------------');

      } catch (error) {
        console.error(`❌ Error processing channel ${channel.id}:`, error.message);
        console.log('----------------------------------------');
      }
    }

    console.log('========================================');
    console.log(`🎉 Search and store operation completed`);
    console.log(`📊 Total channels processed: ${storedChannels.length}`);
    console.log(`✅ Database operations successful`);

    return storedChannels;
  } catch (error) {
    console.error('Error searching channels:', error);
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

    if (!process.env.YOUTUBE_API_KEY) {
      console.error('YOUTUBE_API_KEY environment variable is required');
      process.exit(1);
    }

    const results = await searchAndStoreChannels('inner circle trader', USER_ID);

    console.log('========================================');
    console.log('🚀 SCRIPT EXECUTION SUMMARY');
    console.log('========================================');
    console.log(`✅ Search Query: "inner circle trader"`);
    console.log(`✅ User ID: ${USER_ID}`);
    console.log(`✅ Channels Found: ${results.length}`);
    console.log(`✅ Database URL: ${process.env.DATABASE_URL ? '✓ Configured' : '✗ Missing'}`);
    console.log(`✅ YouTube API Key: ${process.env.YOUTUBE_API_KEY ? '✓ Configured' : '✗ Missing'}`);
    console.log('========================================');
    console.log('✨ Operation completed successfully!');
    console.log('========================================');

    process.exit(0);

  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

main();
