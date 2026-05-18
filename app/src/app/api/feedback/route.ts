import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// POST: Add feedback for a track
export async function POST(request: NextRequest) {
  try {
    const { trackId, trackName, artistName, feedbackType } = await request.json();
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!trackId || !feedbackType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validFeedbackTypes = ['nailed_it', 'failed_it', 'already_have', 'wow_so_good'];
    if (!validFeedbackTypes.includes(feedbackType)) {
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
    }

    // Upsert feedback
    const feedback = await prisma.trackFeedback.upsert({
      where: {
        userId_trackId: {
          userId,
          trackId,
        },
      },
      update: {
        feedbackType,
      },
      create: {
        userId,
        trackId,
        trackName,
        artistName,
        feedbackType,
      },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Track feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

// GET: Get feedback for tracks
export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const feedbacks = await prisma.trackFeedback.findMany({
    where: { userId },
  });

  return NextResponse.json({ feedbacks });
}
