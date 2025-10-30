#!/usr/bin/env node

require('dotenv').config({ path: './.env.local' });
const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

async function testCurrentTranscriptAPI(videoId) {
  console.log('🧪 Testing current YouTube Captions API for video:', videoId);
  try {
    // Test our current approach
    const captionsResponse = await youtube.captions.list({
      part: ['snippet'],
      videoId: videoId,
    });

    console.log('📋 Caption tracks found:', captionsResponse.data.items?.length || 0);
    if (captionsResponse.data.items) {
      captionsResponse.data.items.forEach((caption, index) => {
        console.log(`${index + 1}. Language: ${caption.snippet?.language}, Status: ${caption.snippet?.status}`);
        console.log(`   Track: ${caption.snippet?.name}`);
      });
    }

    // Try downloading if captions exist
    if (captionsResponse.data.items && captionsResponse.data.items.length > 0) {
      console.log('⏬ Attempting to download caption...');
      try {
        const downloadResponse = await youtube.captions.download({
          id: captionsResponse.data.items[0].id,
          tfmt: 'srt',
        });
        console.log('✅ Caption download successful!');
        console.log('Length:', downloadResponse.data?.length || 'unknown');
        console.log('Sample:', (downloadResponse.data || '').substring(0, 200));
        return downloadResponse.data;
      } catch (downloadError) {
        console.log('❌ Caption download failed:', downloadError.message);
        console.log('🔍 This usually means:');
        console.log('   - Caption track exists but is restricted');
        console.log('   - YouTube API quota exceeded');
        console.log('   - Caption download method not allowed');
      }
    }

  } catch (error) {
    console.log('💥 Current API failed completely:', error.message);
  }
  return null;
}

// Alternative approach: Check if video has auto-generated captions
async function testAlternativeApproaches(videoId) {
  console.log('\n🆕 TESTING ALTERNATIVE APPROACHES...');

  try {
    // Get video details to see caption status
    const videoResponse = await youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: videoId,
    });

    if (videoResponse.data.items && videoResponse.data.items.length > 0) {
      const video = videoResponse.data.items[0];
      console.log('📹 Video details:');
      console.log('   Title:', video.snippet?.title);
      console.log('   Duration:', video.contentDetails?.duration);

      // Check if video has caption=true flag
      const hasCaptions = video.contentDetails?.caption === 'true';
      console.log('   Has captions enabled:', hasCaptions ? '✅ YES' : '❌ NO');

      // Suggest alternative solutions
      console.log('\n💡 RECOMMENDED ALTERNATIVES for Inner Circle Trader:');
      console.log('1. 🎯 YouTube Transcript API (unofficial but reliable)');
      console.log('2. 🔗 Web scraping approach');
      console.log('3. 📱 Third-party transcription services');
      console.log('4. 🎥 Manual transcript uploads from user');
    }
  } catch (videoError) {
    console.log('💥 Failed to get video details:', videoError.message);
  }
}

async function testUnofficialMethod(videoId) {
  console.log('\n🆕 TESTING UNOFFICIAL TRANSCRIPT API METHOD:');
  console.log('🎯 This should work for Inner Circle Trader videos...');

  try {
    // Import and test our new function
    const { getYouTubeTranscriptUnofficial } = require('./src/lib/youtube.ts');

    const transcript = await getYouTubeTranscriptUnofficial(videoId);

    if (transcript) {
      console.log('🎉 UNOFFICIAL METHOD SUCCESS!');
      console.log('📝 Transcript found:', transcript.length, 'characters');
      console.log('📋 Sample:', transcript.substring(0, 200) + '...');
      return transcript;
    } else {
      console.log('❌ Unofficial method also failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Unofficial method error:', error.message);
    return null;
  }
}

async function main() {
  const videoId = process.argv[2] || 'N4gTPOnZIYw';
  console.log('🎬 Testing transcription for Inner Circle Trader video:', videoId);
  console.log('=');

  const currentResult = await testCurrentTranscriptAPI(videoId);
  await testAlternativeApproaches(videoId);
  const unofficialResult = await testUnofficialMethod(videoId);

  console.log('\n🏁 CONCLUSION:');
  if (currentResult) {
    console.log('✅ Current method works! Use YouTube Captions API');
  } else if (unofficialResult) {
    console.log('🎯 BEST METHOD: Unofficial Transcript API works!');
    console.log('✅ RECOMMEND: Use getYouTubeTranscriptUnofficial()');
  } else {
    console.log('❌ Both methods failed for Inner Circle Trader videos');
    console.log('🔄 Need further alternative solutions');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
