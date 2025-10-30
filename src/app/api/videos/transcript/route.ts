import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { getVideoCaptions } from '@/lib/youtube';

/**
 * GET /api/videos/transcript?videoId=VIDEO_ID - Get video transcript and log to console
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId') || searchParams.get('v'); // Support both formats

    if (!videoId) {
      return NextResponse.json({
        error: 'Video ID is required. Use ?videoId=VIDEO_ID or ?v=VIDEO_ID'
      }, { status: 400 });
    }

    console.log(`🎭 AI TRANSCRIPTION AGENT: Starting for video ${videoId}`);
    console.log(`👤 User: ${user.id}`);
    console.log(`🎬 Video ID: ${videoId}`);

    // Get video transcript
    const transcript = await getVideoCaptions(videoId);

    console.log(`📝 TRANSCRIPT FOUND FOR ${videoId}:`);
    console.log(`========================================`);

    if (transcript) {
      console.log(transcript);

      // Count words for summary
      const wordCount = transcript.split(' ').filter(word => word.length > 0).length;
      const charCount = transcript.length;

      console.log(`========================================`);
      console.log(`📊 STATS: ${wordCount} words, ${charCount} characters`);
      console.log(`✅ SUCCESS: Transcription logged for video ${videoId}`);
      console.log(`🤖 AI TRANSCRIPTION AGENT: Complete\n`);

      return NextResponse.json({
        success: true,
        videoId,
        transcript,
        stats: {
          wordCount,
          characterCount: charCount,
          hasContent: true
        },
        message: 'Transcription logged to console',
        loggedBy: 'Free AI Agent',
        method: 'YouTube Captions API'
      });

    } else {
      console.log(`❌ No transcript available for video ${videoId}`);
      console.log(`💡 This could be because:`);
      console.log(`   - Video has no captions available`);
      console.log(`   - Video has captions but they are disabled`);
      console.log(`   - API quota exceeded`);
      console.log(`   - YouTube API key issues`);
      console.log(`🤖 AI TRANSCRIPTION AGENT: Failed - No transcript\n`);

      return NextResponse.json({
        success: false,
        videoId,
        transcript: null,
        error: 'No transcript available',
        stats: {
          wordCount: 0,
          characterCount: 0,
          hasContent: false
        },
        message: 'No transcription found - see console logs for details'
      });
    }

  } catch (error: any) {
    console.error(`💥 TRANSCRIPTION ERROR for video:`, error);
    console.log(`🤖 AI TRANSCRIPTION AGENT: Error occurred\n`);

    return NextResponse.json({
      success: false,
      error: 'Transcription failed',
      details: error?.message || 'Unknown error',
      loggedBy: 'Free AI Agent',
      suggestion: 'Check console logs for detailed error information'
    }, { status: 500 });
  }
}
