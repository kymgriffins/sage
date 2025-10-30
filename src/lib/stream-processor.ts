import { eq } from 'drizzle-orm';
import { db } from './db';
import { processingQueue, streams } from './schema';
import { getVideoCaptions } from './youtube';

interface TradeSignal {
  type: 'buy' | 'sell' | 'hold' | 'neutral';
  confidence: number; // 0-1
  reasoning: string;
  timestamp?: string;
}

interface MarketAnalysis {
  indicators: string[];
  strategies: string[];
  timeframes: string[];
  symbols: string[];
  pricePatterns: string[];
}

interface AnalysisResult {
  tradeSignals: TradeSignal[];
  marketAnalysis: MarketAnalysis;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  keyInsights: string[];
  confidence: number;
}

/**
 * Simple trade signal detection patterns
 */
const TRADE_PATTERNS = {
  buy: /\b(buy|long|bullish|bulls?|purchase|acquire|invest|portfolio|position)\b/gi,
  sell: /\b(sell|short|bearish|bears?|dispose|divest|exit|stop|close)\b/gi,
  indicators: /\b(rsi|macd|sma|ema|bollinger|fibonacci|stochastics|atr)\b/gi,
  strategies: /\b(scalping|swing|position|day.*trade?|momentum|breakout|pullback)\b/gi,
  timeframes: /\b(1m|5m|15m|30m|1h|4h|daily|weekly|monthly)\b/gi,
  symbols: /\b(aapl|amzn|msft|tsla|googl|nvda|btc|eth|spx|ndx)\b/gi,
  pricePatterns: /\b(support|resistance|breakout|reversal|fractal|impulse)\b/gi,
};

/**
 * Analyze transcript for trade signals and market insights
 */
function analyzeTranscript(transcript: string): AnalysisResult {
  const lowerTranscript = transcript.toLowerCase();

  const tradeSignals: TradeSignal[] = [];

  // Basic sentiment analysis
  const buyMatches = (lowerTranscript.match(TRADE_PATTERNS.buy) || []).length;
  const sellMatches = (lowerTranscript.match(TRADE_PATTERNS.sell) || []).length;

  if (buyMatches > sellMatches && buyMatches > 2) {
    tradeSignals.push({
      type: 'buy',
      confidence: Math.min(buyMatches * 0.2, 0.8),
      reasoning: `${buyMatches} buy signals detected`,
    });
  } else if (sellMatches > buyMatches && sellMatches > 2) {
    tradeSignals.push({
      type: 'sell',
      confidence: Math.min(sellMatches * 0.2, 0.8),
      reasoning: `${sellMatches} sell signals detected`,
    });
  } else {
    tradeSignals.push({
      type: 'neutral',
      confidence: 0.5,
      reasoning: 'Mixed or no clear trade direction signals',
    });
  }

  // Extract market analysis
  const marketAnalysis: MarketAnalysis = {
    indicators: [...new Set(lowerTranscript.match(TRADE_PATTERNS.indicators))],
    strategies: [...new Set(lowerTranscript.match(TRADE_PATTERNS.strategies))],
    timeframes: [...new Set(lowerTranscript.match(TRADE_PATTERNS.timeframes))],
    symbols: [...new Set(lowerTranscript.match(TRADE_PATTERNS.symbols))],
    pricePatterns: [...new Set(lowerTranscript.match(TRADE_PATTERNS.pricePatterns))],
  };

  // Determine overall sentiment
  const sentiment = buyMatches > sellMatches ? 'bullish' :
    sellMatches > buyMatches ? 'bearish' : 'neutral';

  // Extract key insights (simplified: look for dollar signs or key phrases)
  const keyInsights: string[] = [];
  const dollarPattern = /\$\d+(\.\d{1,2})?/g;
  const dollarMatches = transcript.match(dollarPattern) || [];
  if (dollarMatches.length > 0) {
    keyInsights.push(`Potential price references: ${dollarMatches.slice(0, 3).join(', ')}`);
  }

  // Overall confidence
  const confidence = Math.max(0.3, (buyMatches + sellMatches + dollarMatches.length) / 20);

  return {
    tradeSignals,
    marketAnalysis,
    sentiment,
    keyInsights,
    confidence,
  };
}

/**
 * Mock AI analysis for more sophisticated processing (placeholder)
 */
async function performAIAnalysis(transcript: string): Promise<AnalysisResult> {
  // This would integrate with an AI service like OpenAI for more accurate analysis
  // For MVP, using the simple pattern matching above
  return analyzeTranscript(transcript);
}

/**
 * Process a single stream from the queue
 */
async function processStream(streamId: string): Promise<AnalysisResult | null> {
  try {
    // Get stream details
    const streamResult = await db
      .select()
      .from(streams)
      .where(eq(streams.id, streamId))
      .limit(1);

    if (streamResult.length === 0) {
      throw new Error('Stream not found');
    }

    const stream = streamResult[0];

    // Skip if already processed
    if (stream.status !== 'pending') {
      return null;
    }

    // Get transcript
    const transcript = await getVideoCaptions(stream.youtubeId);

    if (!transcript) {
      console.log(`No transcript available for stream ${streamId}`);
      await db.update(streams)
        .set({
          status: 'failed',
          analysisData: {
            error: 'No transcript available',
          },
        })
        .where(eq(streams.id, streamId));
      return null;
    }

    // Perform analysis
    const analysis = await performAIAnalysis(transcript);

    // Store results
    await db.update(streams)
      .set({
        status: 'completed',
        transcript: transcript.substring(0, 10000), // Limit transcript size
        analysisData: analysis,
        processingCompletedAt: new Date(),
      })
      .where(eq(streams.id, streamId));

    return analysis;
  } catch (error) {
    console.error(`Error processing stream ${streamId}:`, error);

    // Update status to failed
    await db.update(streams)
      .set({
        status: 'failed',
        analysisData: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      .where(eq(streams.id, streamId));

    return null;
  }
}

/**
 * Process streams from the queue with priority
 */
export async function processQueuedStreams(batchSize: number = 10): Promise<{ processed: number; failed: number }> {
  try {
    // Get queued streams ordered by priority (desc) and age (asc)
    const queuedStreams = await db
      .select({
        id: processingQueue.id,
        streamId: processingQueue.streamId,
      })
      .from(processingQueue)
      .where(eq(processingQueue.status, 'queued'))
      .orderBy(processingQueue.priority, processingQueue.queuedAt)
      .limit(batchSize);

    if (queuedStreams.length === 0) {
      return { processed: 0, failed: 0 };
    }

    let processed = 0;
    let failed = 0;

    for (const queueItem of queuedStreams) {
      try {
        // Mark as processing
        await db.update(processingQueue)
          .set({
            status: 'processing' as const,
            processingStartedAt: new Date(),
          })
          .where(eq(processingQueue.id, queueItem.id));

        // Process the stream
        const result = await processStream(queueItem.streamId);

        // Mark as completed
        await db.update(processingQueue)
          .set({
            status: 'completed' as const,
            completedAt: new Date(),
          })
          .where(eq(processingQueue.id, queueItem.id));

        if (result) {
          processed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to process queue item ${queueItem.id}:`, error);

        // Mark as failed
        await db.update(processingQueue) // @ts-ignore - Drizzle type inference issue
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message || 'Unknown error' : 'Unknown error',
          })
          .where(eq(processingQueue.id, queueItem.id));

        failed++;
      }
    }

    return { processed, failed };
  } catch (error) {
    console.error('Error processing queued streams:', error);
    throw error;
  }
}

/**
 * Get processing queue status for a user
 */
export async function getProcessingStatus(userId: string): Promise<any> {
  const queueStats = await db
    .select()
    .from(processingQueue)
    .where(eq(processingQueue.userId, userId));

  const stats = {
    total: queueStats.length,
    queued: queueStats.filter(q => q.status === 'queued').length,
    processing: queueStats.filter(q => q.status === 'processing').length,
    completed: queueStats.filter(q => q.status === 'completed').length,
    failed: queueStats.filter(q => q.status === 'failed').length,
  };

  return stats;
}
