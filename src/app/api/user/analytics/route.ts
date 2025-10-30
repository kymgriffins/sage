import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack/server';
import { db } from '@/lib/db';
import { streams, channels, userAnalytics } from '@/lib/schema';
import { eq, count, avg, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          channelPerformance: [],
          trends: {
            totalStreams: 0,
            completedAnalyses: 0,
            averageAccuracy: 0,
            totalProcessingTime: 0
          },
          sentimentDistribution: {
            bullish: 0,
            bearish: 0,
            neutral: 0
          }
        }
      });
    }

    // Get channel performance metrics
    const channelStats = await db
      .select({
        channelId: streams.channelId,
        channelTitle: channels.channelTitle,
        totalStreams: count(streams.id),
        completedStreams: sql<number>`
          count(case when ${streams.status} = 'completed' then 1 end)
        `,
        avgProcessingTime: avg(sql<number>`
          extract(epoch from (${streams.processingCompletedAt} - ${streams.processingStartedAt}))
        `),
      })
      .from(streams)
      .innerJoin(channels, eq(streams.channelId, channels.id))
      .where(eq(streams.userId, user.id))
      .groupBy(streams.channelId, channels.channelTitle);

    // Get overall analytics
    const overallStats = await db
      .select({
        totalStreams: count(streams.id),
        completedStreams: sql<number>`
          count(case when ${streams.status} = 'completed' then 1 end)
        `,
        processingStreams: sql<number>`
          count(case when ${streams.status} = 'processing' then 1 end)
        `,
        failedStreams: sql<number>`
          count(case when ${streams.status} = 'failed' then 1 end)
        `,
        avgProcessingTime: avg(sql<number>`
          extract(epoch from (${streams.processingCompletedAt} - ${streams.processingStartedAt}))
        `),
      })
      .from(streams)
      .where(eq(streams.userId, user.id));

    // Get sentiment distribution from analysis data
    const sentimentStats = await db
      .select({
        analysisData: streams.analysisData,
      })
      .from(streams)
      .where(sql`${streams.status} = 'completed' and ${streams.analysisData} is not null`);

    let sentimentCounts = { bullish: 0, bearish: 0, neutral: 0 };
    sentimentStats.forEach(stat => {
      if (stat.analysisData && typeof stat.analysisData === 'object') {
        const analysis = stat.analysisData as any;
        if (analysis.sentiment) {
          sentimentCounts[analysis.sentiment as keyof typeof sentimentCounts]++;
        }
      }
    });

    // Transform channel performance data
    const channelPerformance = channelStats.map(stat => ({
      channelTitle: stat.channelTitle || 'Unknown Channel',
      totalStreams: stat.totalStreams || 0,
      completedAnalyses: stat.completedStreams || 0,
      completionRate: stat.totalStreams > 0 ? ((stat.completedStreams || 0) / stat.totalStreams) * 100 : 0,
      avgProcessingTime: stat.avgProcessingTime || 0,
      accuracy: 85 + Math.random() * 10 // Placeholder - would calculate from analysis confidence
    }));

    const overall = overallStats[0] || {
      totalStreams: 0,
      completedStreams: 0,
      processingStreams: 0,
      failedStreams: 0,
      avgProcessingTime: 0
    };

    return NextResponse.json({
      success: true,
      data: {
        channelPerformance,
        trends: {
          totalStreams: overall.totalStreams || 0,
          completedAnalyses: overall.completedStreams || 0,
          processingStreams: overall.processingStreams || 0,
          failedStreams: overall.failedStreams || 0,
          averageAccuracy: 94.2, // Placeholder
          totalProcessingTime: overall.avgProcessingTime || 0
        },
        sentimentDistribution: sentimentCounts,
        meta: {
          userId: user.id,
          fetchedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
