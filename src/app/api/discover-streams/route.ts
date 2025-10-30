import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { discoverStreamsForUser } from '@/lib/stream-discovery';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await isAuthenticated(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Discover new streams for this user
    const result = await discoverStreamsForUser(user.id);

    return NextResponse.json({
      success: true,
      message: `Discovered and queued ${result.newStreams} new streams from ${result.processedChannels} channels`,
      data: result,
    });
  } catch (error) {
    console.error('Error discovering streams:', error);
    return NextResponse.json(
      { error: 'Failed to discover streams' },
      { status: 500 }
    );
  }
}
