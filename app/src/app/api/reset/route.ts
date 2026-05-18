import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// POST: Reset interview + profile + playlists for current user
export async function POST() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.tasteProfile.deleteMany({ where: { userId } });
  await prisma.favourite.deleteMany({ where: { userId } });
  await prisma.cachedTrack.deleteMany({ where: { userId } });

  return NextResponse.json({ success: true });
}