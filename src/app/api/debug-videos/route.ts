import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { streams, channels, channelSubscriptions } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Checking channels and videos ===');

    // Check what channels exist
    const allChannels = await db.select().from(channels);
    console.log(`Total channels in DB: ${allChannels.length}`);

    // Look for inner circle trader
    const ictChannel = allChannels.find(ch =>
      ch.channelTitle.toLowerCase().includes('inner circle') ||
      ch.youtubeChannelId.toLowerCase().includes('circle') ||
      ch.channelTitle.toLowerCase().includes('circle')
    );

    let channelVideos: any[] = [];
    let sampleVideos: any[] = [];

    // Get videos for Inner Circle Trader if found
    if (ictChannel) {
      console.log('Found Inner Circle Trader channel:', ictChannel);

      channelVideos = await db
        .select()
        .from(streams)
        .where(eq(streams.channelId, ictChannel.id))
        .orderBy(desc(streams.createdAt));

      console.log(`Found ${channelVideos.length} videos for Inner Circle Trader`);
    }

    // Get sample videos from all channels
    sampleVideos = await db
      .select({
        id: streams.id,
        title: streams.title,
        youtubeId: streams.youtubeId,
        createdAt: streams.createdAt,
        isLive: streams.isLive,
        channelTitle: channels.channelTitle,
        youtubeChannelId: channels.youtubeChannelId
      })
      .from(streams)
      .innerJoin(channels, eq(streams.channelId, channels.id))
      .orderBy(desc(streams.createdAt))
      .limit(20);

    console.log(`Found ${sampleVideos.length} recent videos across all channels`);

    return NextResponse.json({
      success: true,
      data: {
        totalChannels: allChannels.length,
        innerCircleChannel: ictChannel,
        innerCircleVideos: channelVideos,
        sampleVideos: sampleVideos,
        channelsList: allChannels.slice(0, 5).map(ch => ({
          title: ch.channelTitle,
          youtubeChannelId: ch.youtubeChannelId,
          videoCount: ch.videoCount
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Debug videos error:', error);
    return NextResponse.json(
      { error: 'Failed to debug videos', details: error?.message },
      { status: 500 }
    );
  }
}
