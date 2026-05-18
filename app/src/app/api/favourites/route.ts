// API: Favourites — CRUD operations for taste interview
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// GET: Get user's favourites
export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favourites = await prisma.favourite.findMany({
    where: { userId },
    orderBy: { orderIndex: 'asc' },
  });

  return NextResponse.json({
    favourites: favourites.map(f => ({
      ...f,
      tags: JSON.parse(f.tags),
    })),
  });
}

// POST: Add a favourite track
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackName, artistName, albumName, albumArt, previewUrl } = body;

    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!trackName || !artistName) {
      return NextResponse.json({ error: 'trackName and artistName required' }, { status: 400 });
    }

    // Check count
    const count = await prisma.favourite.count({ where: { userId } });
    if (count >= 10) {
      return NextResponse.json({ error: 'Maximum 10 favourites allowed' }, { status: 400 });
    }

    const trackId = `${artistName}::${trackName}`.toLowerCase();

    const favourite = await prisma.favourite.upsert({
      where: { userId_trackId: { userId, trackId } },
      create: {
        userId,
        trackId,
        trackName,
        artistName,
        albumName: albumName || '',
        albumArt: albumArt || null,
        previewUrl: previewUrl || null,
        orderIndex: count,
      },
      update: {
        trackName,
        artistName,
        albumName: albumName || '',
        albumArt: albumArt || null,
      },
    });

    return NextResponse.json({
      favourite: { ...favourite, tags: JSON.parse(favourite.tags) },
    });
  } catch (error) {
    console.error('Add favourite error:', error);
    return NextResponse.json({ error: 'Failed to add favourite' }, { status: 500 });
  }
}

// PUT: Update favourite answers (love reason, mood, tags, finalized)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, loveReason, moodAnswer, tags, isFinalized } = body;

    if (!id) {
      return NextResponse.json({ error: 'favourite id required' }, { status: 400 });
    }

    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData: Record<string, unknown> = {};
    if (loveReason !== undefined) updateData.loveReason = loveReason;
    if (moodAnswer !== undefined) updateData.moodAnswer = moodAnswer;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (isFinalized !== undefined) updateData.isFinalized = isFinalized;

    const updated = await prisma.favourite.updateMany({
      where: { id, userId },
      data: updateData,
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Favourite not found' }, { status: 404 });
    }

    const favourite = await prisma.favourite.findUnique({ where: { id } });
    if (!favourite) {
      return NextResponse.json({ error: 'Favourite not found' }, { status: 404 });
    }

    return NextResponse.json({
      favourite: { ...favourite, tags: JSON.parse(favourite.tags) },
    });
  } catch (error) {
    console.error('Update favourite error:', error);
    return NextResponse.json({ error: 'Failed to update favourite' }, { status: 500 });
  }
}

// DELETE: Remove a favourite
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'favourite id required' }, { status: 400 });
  }

  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deleted = await prisma.favourite.deleteMany({ where: { id, userId } });
  if (deleted.count === 0) {
    return NextResponse.json({ error: 'Favourite not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
