const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

async function testAPIKey() {
  console.log('🧪 Testing YouTube API Key...\n');

  // Check if API key exists
  if (!process.env.YOUTUBE_API_KEY) {
    console.error('❌ YOUTUBE_API_KEY environment variable not found');

    // Try to read it directly from file
    try {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      const apiKeyMatch = envContent.match(/YOUTUBE_API_KEY=(.+)/);
      if (apiKeyMatch) {
        process.env.YOUTUBE_API_KEY = apiKeyMatch[1].trim();
        console.log('🔄 Loaded API key from file directly:', process.env.YOUTUBE_API_KEY.substring(0, 12) + '...');
      } else {
        console.error('❌ Could not find YOUTUBE_API_KEY in .env.local');
        return false;
      }
    } catch (error) {
      console.error('❌ Could not read .env.local file:', error.message);
      return false;
    }
  }

  console.log('🔑 API Key loaded:', process.env.YOUTUBE_API_KEY ? 'YES' : 'NO');
  console.log('🔑 API Key starts with:', process.env.YOUTUBE_API_KEY.substring(0, 12) + '...');

  const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
  });

  try {
    // Test with the simplest possible request - just get some basic search results
    console.log('Testing simple search...');
    const response = await youtube.search.list({
      part: 'snippet',
      q: 'test',
      type: 'video',
      maxResults: 1,
    });
    console.log('✅ API key works! Found test results.');
    return true;
  } catch (error) {
    console.error('❌ API key test failed:', error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function fetchVideosForChannel(youtube, channelResponse, channelId) {
  console.log(`📺 Fetching videos for channel: ${channelId}\n`);

  // Get videos for this channel
  console.log('🎬 Fetching latest videos...');
  const videosResponse = await youtube.search.list({
    part: 'snippet',
    channelId: channelId,
    order: 'date',
    type: 'video',
    maxResults: 50, // Get up to 50 most recent videos
  });

  const videos = videosResponse.data.items || [];

  console.log(`📹 Found ${videos.length} videos\n`);

  // Get detailed video info (durations, etc.)
  console.log('🔍 Getting detailed video information...');
  if (videos.length > 0) {
    const videoIds = videos.map(video => video.id.videoId).join(',');

    const videoDetailsResponse = await youtube.videos.list({
      part: 'snippet,statistics,contentDetails,liveStreamingDetails',
      id: videoIds,
    });

    const detailedVideos = videoDetailsResponse.data.items || [];

    // Combine search results with detailed info
    const fullVideoData = detailedVideos.map(detail => {
      const searchItem = videos.find(v => v.id.videoId === detail.id);
      return {
        id: detail.id,
        title: detail.snippet.title,
        description: detail.snippet.description,
        publishedAt: detail.snippet.publishedAt,
        channelTitle: detail.snippet.channelTitle,
        channelId: detail.snippet.channelId,
        thumbnails: detail.snippet.thumbnails,
        tags: detail.snippet.tags || [],
        duration: detail.contentDetails.duration,
        viewCount: detail.statistics.viewCount,
        likeCount: detail.statistics.likeCount,
        commentCount: detail.statistics.commentCount,
        isLive: !!detail.liveStreamingDetails?.actualStartTime,
        isUpcoming: !!detail.liveStreamingDetails?.scheduledStartTime && !detail.liveStreamingDetails.actualStartTime,
        scheduledStartTime: detail.liveStreamingDetails?.scheduledStartTime,
        actualStartTime: detail.liveStreamingDetails?.actualStartTime,
        url: `https://www.youtube.com/watch?v=${detail.id}`,
      };
    });

    // Sort by date (newest first)
    fullVideoData.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Save to file
    const outputData = {
      channel: {
        id: channelId,
        title: channelResponse.data.items[0].snippet.title,
        description: channelResponse.data.items[0].snippet.description,
        subscriberCount: channelResponse.data.items[0].statistics.subscriberCount,
        videoCount: channelResponse.data.items[0].statistics.videoCount,
        viewCount: channelResponse.data.items[0].statistics.viewCount,
      },
      videos: fullVideoData,
      fetch: {
        timestamp: new Date().toISOString(),
        totalVideos: fullVideoData.length,
        apiQuotaUsed: videosResponse.data.pageInfo?.totalResults || 0,
      },
    };

    fs.writeFileSync('inner-circle-videos.json', JSON.stringify(outputData, null, 2));
    console.log(`✅ Data saved to inner-circle-videos.json\n`);

    // Print summary
    console.log('📊 VIDEO SUMMARY:');
    console.log(`   Total videos: ${fullVideoData.length}`);
    console.log(`   Live streams: ${fullVideoData.filter(v => v.isLive).length}`);
    console.log(`   Upcoming live: ${fullVideoData.filter(v => v.isUpcoming).length}`);
    console.log(`   Regular videos: ${fullVideoData.filter(v => !v.isLive && !v.isUpcoming).length}\n`);

    console.log('🎯 SAMPLE VIDEOS:');
    fullVideoData.slice(0, 5).forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   Views: ${video.viewCount} | Published: ${new Date(video.publishedAt).toLocaleDateString()}`);
      console.log(`   ${video.isLive ? '🔴 LIVE NOW' : video.isUpcoming ? '🟡 UPCOMING LIVE' : '✅ REGULAR'}`);
      console.log('');
    });

    return outputData;

  } else {
    console.log('❌ No videos found for this channel');
    return null;
  }
}

async function getInnerCircleVideos() {
  try {
    console.log('🔍 Starting Inner Circle Trader video fetch...\n');

    // Test API key first
    const apiKeyWorks = await testAPIKey();
    if (!apiKeyWorks) {
      console.error('❌ Cannot proceed without working API key');
      return null;
    }

    // Initialize YouTube API
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });

    // Inner Circle Trader Channel ID (from their YouTube URL or my research)
    const channelId = 'UCCvAyFxccccqXJ6rxe-l6EA';

    console.log(`📺 Fetching videos for channel: ${channelId}\n`);

    // Get channel info first
    console.log('📊 Getting channel details...');
    const channelResponse = await youtube.channels.list({
      part: 'snippet,statistics',
      id: channelId,
    });

    if (channelResponse.data.items && channelResponse.data.items.length > 0) {
      const channel = channelResponse.data.items[0];
      console.log(`✅ Channel found: ${channel.snippet.title}`);
      console.log(`   Subscribers: ${channel.statistics.subscriberCount}`);
      console.log(`   Video count: ${channel.statistics.videoCount}`);
      console.log(`   View count: ${channel.statistics.viewCount}\n`);

      // Fetch videos using the working channel ID
      return await fetchVideosForChannel(youtube, channelResponse, channelId);
    } else {
      console.log(`❌ Channel ID '${channelId}' not found or not accessible`);
      console.log('Let me try searching for Inner Circle Trader instead...');

      // Search for the channel by name
      const searchResponse = await youtube.search.list({
        part: 'snippet',
        q: 'Inner Circle Trader',
        type: 'channel',
        maxResults: 5,
      });

      console.log('🔍 Search results:');
      if (searchResponse.data.items && searchResponse.data.items.length > 0) {
        searchResponse.data.items.forEach((item, index) => {
          console.log(`${index + 1}. ${item.snippet.channelTitle} (ID: ${item.snippet.channelId})`);
        });

        // Use the first result if it looks right
        const firstResult = searchResponse.data.items[0];
        if (firstResult.snippet.channelTitle.toLowerCase().includes('inner circle')) {
          console.log(`🔄 Using found channel ID: ${firstResult.snippet.channelId}`);
          // Need channel response for the new channel too
          const newChannelResponse = await youtube.channels.list({
            part: 'snippet,statistics',
            id: firstResult.snippet.channelId,
          });
          return await fetchVideosForChannel(youtube, newChannelResponse, firstResult.snippet.channelId);
        }
      }

      return null;
    }

  } catch (error) {
    console.error('💥 Error fetching Inner Circle Trader videos:', error.response?.data?.error || error.message);
    return null;
  }
}

// Run the script
if (require.main === module) {
  getInnerCircleVideos()
    .then(() => console.log('🏁 Script completed'))
    .catch(console.error);
}

module.exports = { getInnerCircleVideos };
