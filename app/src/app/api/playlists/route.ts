// API: Playlist Generation Engine
// Last.fm discovery → Groq curation → Odesli cross-platform links
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSimilarTracks, getSimilarArtists, getArtistTopTracks, getTrackInfo } from '@/lib/lastfm';
import { curatePlaylist, getContexts, type CandidateTrack } from '@/lib/groq';
import { getSongLinks } from '@/lib/odesli';
import { requireUserId } from '@/lib/auth';

function getRateLimitConfig() {
  return {
    enabled: process.env.PLAYLIST_RATE_LIMIT_ENABLED === 'true',
    maxPerDay: parseInt(process.env.PLAYLIST_RATE_LIMIT_MAX_PER_DAY || '0', 10),
    maxPerWeek: parseInt(process.env.PLAYLIST_RATE_LIMIT_MAX_PER_WEEK || '0', 10),
    maxPerHour: parseInt(process.env.PLAYLIST_RATE_LIMIT_MAX_PER_HOUR || '0', 10),
  };
}

function buildLimitMessage(unit: string, max: number) {
  return `Free plan limit reached: ${max} per ${unit}. Please try later.`;
}

// POST: Generate a playlist for a context
export async function POST(request: NextRequest) {
  try {
    const { context, forceRegenerate } = await request.json();

    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!context) {
      return NextResponse.json({ error: 'context required' }, { status: 400 });
    }

    // Validate context
    const validContexts = getContexts().map(c => c.id);
    if (!validContexts.includes(context)) {
      return NextResponse.json({ error: 'Invalid context' }, { status: 400 });
    }

    // Check cache (1 hour)
    if (!forceRegenerate) {
      const cached = await prisma.playlist.findFirst({
        where: {
          userId,
          context,
          cacheExpiresAt: { gt: new Date() },
        },
        orderBy: { cachedAt: 'desc' },
      });

      if (cached) {
        return NextResponse.json({
          playlist: {
            ...cached,
            tracks: JSON.parse(cached.tracks),
            fromCache: true,
          },
        });
      }
    }

    const rateLimit = getRateLimitConfig();
    if (rateLimit.enabled) {
      const now = new Date();
      if (rateLimit.maxPerHour > 0) {
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const count = await prisma.playlist.count({
          where: { userId, createdAt: { gte: hourAgo } },
        });
        if (count >= rateLimit.maxPerHour) {
          return NextResponse.json(
            { error: buildLimitMessage('hour', rateLimit.maxPerHour) },
            { status: 429 }
          );
        }
      }

      if (rateLimit.maxPerDay > 0) {
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const count = await prisma.playlist.count({
          where: { userId, createdAt: { gte: dayAgo } },
        });
        if (count >= rateLimit.maxPerDay) {
          return NextResponse.json(
            { error: buildLimitMessage('day', rateLimit.maxPerDay) },
            { status: 429 }
          );
        }
      }

      if (rateLimit.maxPerWeek > 0) {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const count = await prisma.playlist.count({
          where: { userId, createdAt: { gte: weekAgo } },
        });
        if (count >= rateLimit.maxPerWeek) {
          return NextResponse.json(
            { error: buildLimitMessage('week', rateLimit.maxPerWeek) },
            { status: 429 }
          );
        }
      }
    }

    // Get user's taste profile
    const tasteProfile = await prisma.tasteProfile.findUnique({ where: { userId } });
    if (!tasteProfile) {
      return NextResponse.json(
        { error: 'No taste profile found. Complete the taste interview first.' },
        { status: 400 }
      );
    }

    // Get user's favourites
    const favourites = await prisma.favourite.findMany({
      where: { userId, isFinalized: true },
    });

    if (favourites.length < 5) {
      return NextResponse.json(
        { error: 'Need at least 5 favourites' },
        { status: 400 }
      );
    }

    // Exclude tracks user disliked or marked as kinda_mid
    const userFeedback = await prisma.trackFeedback.findMany({
      where: {
        userId,
        feedbackType: { in: ['failed_it', 'kinda_mid'] },
      },
    });
    const excludedTrackKeys = new Set(userFeedback.map(f => f.trackId.toLowerCase()));

    // ═══ STEP 1: Build candidate pool via Last.fm ═══
    const candidates: CandidateTrack[] = [];
    const seenTracks = new Set<string>();

    // For each favourite, get similar tracks
    for (const fav of favourites.slice(0, 8)) {
      const similar = await getSimilarTracks(fav.artistName, fav.trackName, 15);
      for (const track of similar) {
        const key = `${track.artist}::${track.name}`.toLowerCase();
        if (!seenTracks.has(key) && !excludedTrackKeys.has(key)) {
          seenTracks.add(key);
          const info = await getTrackInfo(track.artist, track.name);
          candidates.push({
            name: track.name,
            artist: track.artist,
            tags: info?.tags || [],
            similaritySource: `${fav.trackName} by ${fav.artistName}`,
          });
        }
      }
    }

    // Get similar artists and their top tracks
    const uniqueArtists = [...new Set(favourites.map(f => f.artistName))];
    for (const artist of uniqueArtists.slice(0, 5)) {
      const similarArtists = await getSimilarArtists(artist, 5);
      for (const simArtist of similarArtists.slice(0, 3)) {
        const topTracks = await getArtistTopTracks(simArtist.name, 5);
        for (const track of topTracks) {
          const key = `${track.artist}::${track.name}`.toLowerCase();
          if (!seenTracks.has(key)) {
            seenTracks.add(key);
            candidates.push({
              name: track.name,
              artist: track.artist,
              tags: [],
              similaritySource: `similar to ${artist}`,
            });
          }
        }
      }
    }

    if (candidates.length < 20) {
      return NextResponse.json(
        { error: 'Not enough candidate tracks found. Try adding more diverse favourites.' },
        { status: 400 }
      );
    }

    // ═══ STEP 2: LLM Curation ═══
    const profileData = {
      semanticTags: JSON.parse(tasteProfile.semanticTags),
      moods: JSON.parse(tasteProfile.moods),
      summaryText: tasteProfile.summaryText,
      internalNotes: tasteProfile.internalNotes,
    };

    const favouriteNames = favourites.map(f => `"${f.trackName}" by ${f.artistName}`);

    const curation = await curatePlaylist(
      context,
      profileData,
      candidates.slice(0, 80), // Send top 80 candidates to LLM
      favouriteNames,
    );

    // ═══ STEP 3: Get cross-platform links ═══
    const tracksWithLinks = [];
    for (const track of curation.tracks.slice(0, 20)) {
      const links = await getSongLinks(track.artist, track.name);
      tracksWithLinks.push({
        ...track,
        platformLinks: links?.platformLinks || {},
        thumbnailUrl: links?.thumbnailUrl || null,
        songLinkUrl: links?.pageUrl || null,
      });
    }

    // ═══ STEP 4: Save playlist ═══
    const contextInfo = getContexts().find(c => c.id === context);
    const monthYear = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const playlistName = `MusiBrain – ${contextInfo?.title || context} – ${monthYear}`;

    const playlist = await prisma.playlist.create({
      data: {
        userId,
        context,
        name: playlistName,
        description: curation.playlistDescription,
        tracks: JSON.stringify(tracksWithLinks),
        cachedAt: new Date(),
        cacheExpiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour cache
      },
    });

    return NextResponse.json({
      playlist: {
        ...playlist,
        tracks: tracksWithLinks,
        fromCache: false,
      },
    });
  } catch (error) {
    console.error('Playlist generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate playlist. Please try again.' },
      { status: 500 }
    );
  }
}

// GET: Get user's playlists
export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const playlists = await prisma.playlist.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    playlists: playlists.map(p => ({
      ...p,
      tracks: JSON.parse(p.tracks),
    })),
  });
}

// PUT: Rename a playlist
export async function PUT(request: NextRequest) {
  try {
    const { playlistId, name } = await request.json();
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!playlistId || !name || !name.trim()) {
      return NextResponse.json({ error: 'playlistId and name required' }, { status: 400 });
    }

    const updated = await prisma.playlist.updateMany({
      where: { id: playlistId, userId },
      data: { name: name.trim() },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json({
      playlist: {
        ...playlist,
        tracks: JSON.parse(playlist.tracks),
      },
    });
  } catch (error) {
    console.error('Playlist rename error:', error);
    return NextResponse.json({ error: 'Failed to rename playlist' }, { status: 500 });
  }
}
