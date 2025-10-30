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
 * Get videos from a specific channel
 */
export async function getChannelVideos(channelId: string, maxResults = 10): Promise<YouTubeVideo[]> {
  try {
    const response = await youtube.search.list({
      part: ['snippet', 'id'],
      channelId,
      order: 'date',
      maxResults,
      type: ['video'],
    });

    if (!response.data.items) {
      return [];
    }

    const videoIds = response.data.items
      .map(item => item.id?.videoId)
      .filter((id): id is string => Boolean(id));
    if (videoIds.length === 0) {
      return [];
    }

    // Get detailed video info
    const videosResponse = await youtube.videos.list({
      part: ['snippet', 'statistics', 'contentDetails', 'liveStreamingDetails'],
      id: videoIds,
      maxResults: videoIds.length,
    });

    return (videosResponse as any).data.items || [];
  } catch (error) {
    console.error('Error getting channel videos:', error);
    throw new Error('Failed to get channel videos');
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
 * Get transcript/captions for a video (if available)
 */
export async function getVideoCaptions(videoId: string, languageCode = 'en'): Promise<string | null> {
  try {
    const response = await youtube.captions.list({
      part: ['snippet'],
      videoId,
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

    // Download the caption
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
