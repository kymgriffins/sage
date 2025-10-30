import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { processQueuedStreams, getProcessingStatus } from '@/lib/stream-processor';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process a batch of streams
    const result = await processQueuedStreams(5); // Process max 5 at a time

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} streams, ${result.failed} failed`,
      data: result,
    });
  } catch (error) {
    console.error('Error processing streams:', error);
    return NextResponse.json(
      { error: 'Failed to process streams' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get processing status
    const status = await getProcessingStatus(user.id);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting processing status:', error);
    return NextResponse.json(
      { error: 'Failed to get processing status' },
      { status: 500 }
    );
  }
}
