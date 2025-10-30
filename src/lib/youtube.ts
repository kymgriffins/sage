import { google } from 'googleapis';

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
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
 * Get transcript using unofficial YouTube Transcript API
 * This is the BEST METHOD for getting transcripts from most YouTube videos
 * Works even when official API fails (like for monetized channels)
 */
export async function getYouTubeTranscriptUnofficial(videoId: string, languageCode = 'en'): Promise<string | null> {
  try {
    console.log(`📡 Fetching transcript from unofficial YouTube API for: ${videoId}`);

    // This uses the popular unofficial youtube-transcript library approach
    // We'll make requests to YouTube's player API to get caption data
    const playerUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // First, get the video page to check for captions
    const videoPageResponse = await fetch(playerUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!videoPageResponse.ok) {
      console.log('❌ Failed to fetch video page');
      return null;
    }

    const pageContent = await videoPageResponse.text();

    // Check if video has captions
    const hasCaptions = pageContent.includes('"captionTracks":');

    if (!hasCaptions) {
      console.log('⚠️ Video has no captions available');
      return null;
    }

    // Extract caption track URL from video page
    const captionMatch = pageContent.match(/"captionTracks":\s*\[([^\]]*)\]/);

    if (!captionMatch) {
      console.log('⚠️ Could not find caption tracks in page');
      return null;
    }

    try {
      const captionData = JSON.parse(`[${captionMatch[1]}]`);
      const englishCaption = captionData.find((track: any) =>
        track.languageCode === languageCode ||
        track.languageCode?.startsWith(languageCode) ||
        track.kind === 'asr' // Auto-generated captions
      ) || captionData[0]; // Fallback to first available

      if (!englishCaption?.baseUrl) {
        console.log('⚠️ No suitable caption track found');
        return null;
      }

      console.log(`🎯 Found English caption track: ${englishCaption.languageCode}`);

      // Download the captions
      const captionUrl = englishCaption.baseUrl;
      const transcriptResponse = await fetch(captionUrl);

      if (!transcriptResponse.ok) {
        console.log('❌ Failed to download caption data');
        return null;
      }

      const xmlTranscript = await transcriptResponse.text();

      // Convert XML captions to plain text
      const transcript = xmlTranscript
        .replace(/<[^>]*>/g, '') // Remove XML tags
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      if (transcript.length < 50) { // Very short transcripts are likely errors
        console.log('⚠️ Transcript too short, likely invalid');
        return null;
      }

      console.log(`✅ Extracted transcript: ${transcript.length} characters`);
      return transcript;

    } catch (parseError) {
      console.error('❌ Failed to parse caption data:', parseError);
      return null;
    }

  } catch (error) {
    console.error('❌ Unofficial transcript API failed:', error);
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
