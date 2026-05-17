// API: Taste Profile — Generate and manage
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateTasteProfile } from '@/lib/groq';

// POST: Generate taste profile from favourites
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Get user's favourites
    const favourites = await prisma.favourite.findMany({
      where: { userId, isFinalized: true },
      orderBy: { orderIndex: 'asc' },
    });

    if (favourites.length < 5) {
      return NextResponse.json(
        { error: 'Need at least 5 finalized favourites to generate a taste profile' },
        { status: 400 }
      );
    }

    // Prepare data for LLM
    const favouriteInputs = favourites.map(f => ({
      trackName: f.trackName,
      artistName: f.artistName,
      loveReason: f.loveReason,
      moodAnswer: f.moodAnswer,
      tags: JSON.parse(f.tags) as string[],
    }));

    // Generate via Groq LLM
    const profile = await generateTasteProfile(favouriteInputs);

    // Upsert taste profile
    const tasteProfile = await prisma.tasteProfile.upsert({
      where: { userId },
      create: {
        userId,
        semanticTags: JSON.stringify(profile.semanticTags),
        moods: JSON.stringify(profile.moods),
        summaryText: profile.summaryText,
        internalNotes: profile.internalNotes,
        tagIntensities: JSON.stringify(profile.tagIntensities),
      },
      update: {
        semanticTags: JSON.stringify(profile.semanticTags),
        moods: JSON.stringify(profile.moods),
        summaryText: profile.summaryText,
        internalNotes: profile.internalNotes,
        tagIntensities: JSON.stringify(profile.tagIntensities),
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json({
      profile: {
        ...tasteProfile,
        semanticTags: profile.semanticTags,
        moods: profile.moods,
        tagIntensities: profile.tagIntensities,
      }
    });
  } catch (error) {
    console.error('Taste profile error:', error);
    return NextResponse.json(
      { error: 'Failed to generate taste profile' },
      { status: 500 }
    );
  }
}

// GET: Retrieve existing taste profile
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const profile = await prisma.tasteProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return NextResponse.json({ profile: null });
  }

  return NextResponse.json({
    profile: {
      ...profile,
      semanticTags: JSON.parse(profile.semanticTags),
      moods: JSON.parse(profile.moods),
      tagIntensities: JSON.parse(profile.tagIntensities),
    }
  });
}

// PUT: Update taste profile (tag toggles, intensity changes)
export async function PUT(request: NextRequest) {
  try {
    const { userId, semanticTags, moods, tagIntensities, summaryText } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { lastUpdated: new Date() };
    if (semanticTags) updateData.semanticTags = JSON.stringify(semanticTags);
    if (moods) updateData.moods = JSON.stringify(moods);
    if (tagIntensities) updateData.tagIntensities = JSON.stringify(tagIntensities);
    if (summaryText !== undefined) updateData.summaryText = summaryText;

    const profile = await prisma.tasteProfile.update({
      where: { userId },
      data: updateData,
    });

    return NextResponse.json({
      profile: {
        ...profile,
        semanticTags: JSON.parse(profile.semanticTags),
        moods: JSON.parse(profile.moods),
        tagIntensities: JSON.parse(profile.tagIntensities),
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update taste profile' },
      { status: 500 }
    );
  }
}
