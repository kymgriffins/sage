import { google } from 'googleapis';
import OpenAI from 'openai';
import { Readable } from 'stream';
import ytdl from 'ytdl-core';

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

// Initialize OpenAI client (for Whisper transcription)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for YouTube API responses
export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  thumbnails: {
    default?: { url: string };
    high?: { url: string };
  };
  country?: string;
  statistics: {
    viewCount?: number;
    subscriberCount?: number;
    videoCount?: number;
  };
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    thumbnails: {
      default?: { url: string };
      high?: { url: string };
    };
  };
  statistics: {
    viewCount?: number;
    likeCount?: number;
  };
  contentDetails: {
    duration: string; // ISO 8601 duration: PT#H#M#S
    definition: string; // hd, sd
  };
  liveStreamingDetails?: {
    actualStartTime?: string;
    actualEndTime?: string;
    scheduledStartTime?: string;
    concurrentViewers?: number;
    activeLiveChatId?: string;
  };
}

/**
 * Search for YouTube channels by query
 */
export async function searchChannels(query: string, maxResults = 10): Promise<YouTubeChannel[]> {
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['channel'],
      maxResults,
    });

    if (!response.data.items) {
      return [];
    }

    // Get detailed channel info for each result
    const channelIds = response.data.items
      .map(item => item.id?.channelId)
      .filter((id): id is string => Boolean(id));
    if (channelIds.length === 0) {
      return [];
    }

    const channelsResponse = await youtube.channels.list({
      part: ['snippet', 'statistics', 'brandingSettings'],
      id: channelIds,
      maxResults: channelIds.length,
    });

    return (channelsResponse as any).data.items?.map((channel: any) => ({
      id: channel.id!,
      title: channel.snippet?.title || '',
      description: channel.snippet?.description || '',
      customUrl: channel.snippet?.customUrl,
      thumbnails: channel.snippet?.thumbnails || {},
      country: channel.snippet?.country,
      statistics: {
        viewCount: parseInt(channel.statistics?.viewCount || '0'),
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics?.videoCount || '0'),
      },
    })) || [];
  } catch (error) {
    console.error('Error searching channels:', error);
    throw new Error('Failed to search YouTube channels');
  }
}

/**
 * Get transcript/captions for a video (if available) - Official API method
 */
export async function getVideoCaptions(videoId: string, languageCode = 'en'): Promise<string | null> {
  try {
    const response = await youtube.captions.list({
      part: ['snippet'],
      videoId: videoId,
    });

    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    // Find caption in preferred language or any English variant
    const caption = response.data.items.find(item =>
      item.snippet?.language === languageCode ||
      item.snippet?.language?.startsWith(languageCode)
    ) || response.data.items[0];

    if (!caption.id) {
      return null;
    }

    // Download the caption (NOTE: This requires OAuth2, not API key)
    const captionResponse = await youtube.captions.download({
      id: caption.id,
      tfmt: 'srt', // Get as plain text
    });

    return captionResponse.data as string;
  } catch (error) {
    console.error('Error getting video captions:', error);
    return null;
  }
}

/**
 * Get transcript using npm youtube-transcript package
 * This is the BEST METHOD - much more reliable than custom implementations
 * Works even when official API fails (like for monetized channels)
 */
export async function getYouTubeTranscriptUnofficial(videoId: string, languageCode = 'en'): Promise<string | null> {
  try {
    console.log(`📡 Fetching transcript using youtube-transcript npm package for: ${videoId}`);

    // Use the youtube-transcript npm package - most reliable unofficial method
    const { YoutubeTranscript } = await import('youtube-transcript');

    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: languageCode,
    });

    if (!transcript || transcript.length === 0) {
      console.log('⚠️ No transcript available via youtube-transcript package');
      return null;
    }

    console.log(`✅ Retrieved ${transcript.length} transcript segments`);

    // Convert the transcript array to plain text
    const fullTranscript = transcript
      .map((item: any) => item.text)
      .join(' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (fullTranscript.length < 50) {
      console.log('⚠️ Transcript too short, likely invalid');
      return null;
    }

    console.log(`📝 Final transcript: ${fullTranscript.length} characters`);
    return fullTranscript;

  } catch (error: any) {
    console.error('❌ youtube-transcript package failed:', error.message);

    // Try fallback: OpenAI Whisper (requires OPENAI_API_KEY)
    if (process.env.OPENAI_API_KEY) {
      console.log('🔄 Falling back to OpenAI Whisper...');
      try {
        const whisperTranscript = await getWhisperTranscript(videoId);
        if (whisperTranscript) {
          console.log('✅ OpenAI Whisper succeeded!');
          return whisperTranscript;
        }
      } catch (whisperError) {
        console.error('❌ OpenAI Whisper also failed:', whisperError);
      }
    } else {
      console.log('ℹ️ OpenAI Whisper not available (no OPENAI_API_KEY)');
    }

    return null;
  }
}

/**
 * Get transcript using OpenAI Whisper (requires video download)
 * This is paid but very accurate - costs ~$0.005/minute or free credits
 */
async function getWhisperTranscript(videoId: string): Promise<string | null> {
  try {
    console.log(`🎙️ Attempting OpenAI Whisper transcription for: ${videoId}`);

    // Note: This would require downloading the video first, then sending to OpenAI
    // For now, we'll just return null as placeholder since video download is complex
    console.log('⚠️ Whisper transcription requires video download (not implemented yet)');
    console.log('💡 Consider implementing video download + Whisper API');

    return null;
  } catch (error) {
    console.error('❌ OpenAI Whisper failed:', error);
    return null;
  }
}

/**
 * Parse ISO 8601 duration to seconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1]?.replace('H', '') || '0');
  const minutes = parseInt(match[2]?.replace('M', '') || '0');
  const seconds = parseInt(match[3]?.replace('S', '') || '0');

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Determine if a video is a live stream or short
 */
export function getVideoType(video: YouTubeVideo): 'live' | 'upload' | 'short' {
  if (video.liveStreamingDetails?.scheduledStartTime) {
    return 'live';
  }

  const duration = parseDuration(video.contentDetails.duration);
  if (duration <= 60) {
    return 'short'; // Less than 1 minute is typically a short
  }

  return 'upload';
}

/**
 * Get videos from a specific channel (used by stream-discovery)
 */
export async function getChannelVideos(channelId: string, maxResults: number = 25): Promise<YouTubeVideo[]> {
  try {
    const response = await youtube.search.list({
      part: ['snippet'],
      channelId: channelId,
      order: 'date', // Most recent first
      type: ['video'],
      maxResults: maxResults,
      publishedAfter: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
    });

    if (!response.data.items) {
      return [];
    }

    // Get detailed video info including statistics
    const videoIds = response.data.items
      .map(item => item.id?.videoId)
      .filter((id): id is string => Boolean(id));

    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails', 'liveStreamingDetails'],
      id: videoIds,
      maxResults: videoIds.length,
    });

    return (videosResponse as any).data.items?.map((video: any) => ({
      id: video.id!,
      snippet: {
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        publishedAt: video.snippet?.publishedAt || '',
        channelId: video.snippet?.channelId || '',
        channelTitle: video.snippet?.channelTitle || '',
        thumbnails: video.snippet?.thumbnails || {},
      },
      statistics: {
        viewCount: parseInt(String(video.statistics?.viewCount || 0), 10),
        likeCount: parseInt(String(video.statistics?.likeCount || 0), 10),
      },
      contentDetails: {
        duration: video.contentDetails?.duration || '',
        definition: video.contentDetails?.definition || 'sd',
      },
      liveStreamingDetails: video.liveStreamingDetails,
    })) || [];
  } catch (error) {
    console.error('Error getting channel videos:', error);
    throw new Error('Failed to get channel videos');
  }
}
