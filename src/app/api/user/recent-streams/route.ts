import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { db } from '@/lib/db';
import { streams, channels, processingQueue } from '@/lib/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();
    if (!user) {
      // Return mock data for unauthenticated users (development/testing)
      return NextResponse.json({
        success: true,
        data: [
          {
            id: "mock-1",
            title: "Market Structure Breakdown - October 29",
            channelTitle: "Trading Educators Academy",
            status: "completed",
            processingTime: "45s",
            insights: 7,
            createdAt: new Date().toISOString(),
            analysisData: {
              tradeSignals: [{ type: 'buy', confidence: 0.8 }],
              sentiment: 'bullish',
              keyInsights: ['Strong bullish signals detected']
            }
          },
          {
            id: "mock-2",
            title: "Live Session: Scalping Strategies",
            channelTitle: "ICT Mentor",
            status: "processing",
            insights: null,
            createdAt: new Date().toISOString()
          }
        ],
        meta: { total: 2, fetchedAt: new Date().toISOString() }
      });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20); // Max 20

    // Get recent streams for user with analysis data
    const recentStreams = await db
      .select({
        id: streams.id,
        title: streams.title,
        channelTitle: channels.channelTitle,
        youtubeUrl: streams.youtubeUrl,
        status: streams.status,
        processingStartedAt: streams.processingStartedAt,
        processingCompletedAt: streams.processingCompletedAt,
        analysisData: streams.analysisData,
        createdAt: streams.createdAt,
        streamType: streams.streamType,
        viewCount: streams.viewCount,
        durationSeconds: streams.durationSeconds,
      })
      .from(streams)
      .innerJoin(channels, eq(streams.channelId, channels.id))
      .where(eq(streams.userId, user.id))
      .orderBy(desc(streams.createdAt))
      .limit(limit);

    // Enhance with processing time and insights count
    const enhancedStreams = recentStreams.map(stream => {
      let processingTime: string | undefined;
      let insights: number | undefined;

      if (stream.processingStartedAt && stream.processingCompletedAt) {
        const duration = stream.processingCompletedAt.getTime() - stream.processingStartedAt.getTime();
        processingTime = `${Math.round(duration / 1000)}s`;
      }

      if (stream.analysisData && typeof stream.analysisData === 'object') {
        const analysis = stream.analysisData as any;
        insights = analysis.keyInsights?.length || analysis.tradeSignals?.length || 0;
      }

      return {
        id: stream.id,
        title: stream.title || 'Untitled Stream',
        channelTitle: stream.channelTitle || 'Unknown Channel',
        youtubeUrl: stream.youtubeUrl,
        status: stream.status,
        processingTime,
        insights,
        createdAt: stream.createdAt?.toISOString(),
        streamType: stream.streamType,
        viewCount: stream.viewCount,
        durationSeconds: stream.durationSeconds,
        analysisData: stream.analysisData,
      };
    });

    return NextResponse.json({
      success: true,
      data: enhancedStreams,
      meta: {
        total: enhancedStreams.length,
        fetchedAt: new Date().toISOString(),
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching recent streams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent streams' },
      { status: 500 }
    );
  }
}
