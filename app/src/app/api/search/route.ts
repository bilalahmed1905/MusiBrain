// API: Search tracks via Last.fm
import { NextRequest, NextResponse } from 'next/server';
import { searchTracks, getTrackInfo } from '@/lib/lastfm';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ tracks: [] });
  }

  try {
    const tracks = await searchTracks(query.trim(), 20);
    
    // Enrich first 5 results with album art from track info
    const enriched = await Promise.all(
      tracks.slice(0, 10).map(async (track) => {
        const info = await getTrackInfo(track.artist, track.name);
        return {
          ...track,
          album: info?.album || '',
          albumArt: info?.albumArt || track.image || '',
          tags: info?.tags || [],
        };
      })
    );

    return NextResponse.json({ tracks: enriched });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search tracks' },
      { status: 500 }
    );
  }
}
