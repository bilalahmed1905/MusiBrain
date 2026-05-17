// Last.fm API Service
// Handles track search, similar tracks, artist info, and tags

const LASTFM_BASE = 'https://ws.audioscrobbler.com/2.0/';

function getApiKey(): string {
  const key = process.env.LASTFM_API_KEY;
  if (!key || key === 'your_lastfm_api_key_here') {
    throw new Error('LASTFM_API_KEY is not configured. Get one at https://www.last.fm/api/account/create');
  }
  return key;
}

async function lastfmRequest(params: Record<string, string>) {
  const apiKey = getApiKey();
  const searchParams = new URLSearchParams({
    ...params,
    api_key: apiKey,
    format: 'json',
  });

  const res = await fetch(`${LASTFM_BASE}?${searchParams.toString()}`);
  
  if (!res.ok) {
    throw new Error(`Last.fm API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// ── Track Search ──
export interface LastfmTrack {
  name: string;
  artist: string;
  url: string;
  image?: string;
  listeners?: number;
  mbid?: string;
}

export async function searchTracks(query: string, limit = 20): Promise<LastfmTrack[]> {
  const data = await lastfmRequest({
    method: 'track.search',
    track: query,
    limit: String(limit),
  });

  const tracks = data?.results?.trackmatches?.track || [];
  return tracks.map((t: Record<string, unknown>) => ({
    name: t.name as string,
    artist: t.artist as string,
    url: t.url as string,
    image: extractImage(t.image as Array<Record<string, string>>),
    listeners: parseInt(t.listeners as string) || 0,
  }));
}

// ── Track Info (detailed) ──
export interface TrackInfo {
  name: string;
  artist: string;
  album?: string;
  albumArt?: string;
  url: string;
  duration?: number;
  listeners?: number;
  playcount?: number;
  tags: string[];
  summary?: string;
}

export async function getTrackInfo(artist: string, track: string): Promise<TrackInfo | null> {
  try {
    const data = await lastfmRequest({
      method: 'track.getInfo',
      artist,
      track,
      autocorrect: '1',
    });

    const t = data?.track;
    if (!t) return null;

    return {
      name: t.name,
      artist: t.artist?.name || artist,
      album: t.album?.title,
      albumArt: extractImage(t.album?.image),
      url: t.url,
      duration: parseInt(t.duration) || undefined,
      listeners: parseInt(t.listeners) || undefined,
      playcount: parseInt(t.playcount) || undefined,
      tags: (t.toptags?.tag || []).map((tag: Record<string, string>) => tag.name),
      summary: t.wiki?.summary?.replace(/<[^>]*>/g, '') || undefined,
    };
  } catch {
    return null;
  }
}

// ── Similar Tracks ──
export async function getSimilarTracks(artist: string, track: string, limit = 30): Promise<LastfmTrack[]> {
  try {
    const data = await lastfmRequest({
      method: 'track.getSimilar',
      artist,
      track,
      limit: String(limit),
      autocorrect: '1',
    });

    const tracks = data?.similartracks?.track || [];
    return tracks.map((t: Record<string, unknown>) => ({
      name: t.name as string,
      artist: (t.artist as Record<string, string>)?.name || '',
      url: t.url as string,
      image: extractImage(t.image as Array<Record<string, string>>),
    }));
  } catch {
    return [];
  }
}

// ── Similar Artists ──
export async function getSimilarArtists(artist: string, limit = 15): Promise<{ name: string; url: string }[]> {
  try {
    const data = await lastfmRequest({
      method: 'artist.getSimilar',
      artist,
      limit: String(limit),
      autocorrect: '1',
    });

    return (data?.similarartists?.artist || []).map((a: Record<string, string>) => ({
      name: a.name,
      url: a.url,
    }));
  } catch {
    return [];
  }
}

// ── Artist Top Tracks ──
export async function getArtistTopTracks(artist: string, limit = 10): Promise<LastfmTrack[]> {
  try {
    const data = await lastfmRequest({
      method: 'artist.getTopTracks',
      artist,
      limit: String(limit),
      autocorrect: '1',
    });

    const tracks = data?.toptracks?.track || [];
    return tracks.map((t: Record<string, unknown>) => ({
      name: t.name as string,
      artist: (t.artist as Record<string, string>)?.name || artist,
      url: t.url as string,
      image: extractImage(t.image as Array<Record<string, string>>),
      listeners: parseInt(t.listeners as string) || 0,
    }));
  } catch {
    return [];
  }
}

// ── Artist Tags ──
export async function getArtistTags(artist: string): Promise<string[]> {
  try {
    const data = await lastfmRequest({
      method: 'artist.getTopTags',
      artist,
      autocorrect: '1',
    });

    return (data?.toptags?.tag || [])
      .slice(0, 10)
      .map((t: Record<string, string>) => t.name);
  } catch {
    return [];
  }
}

// ── Helper: Extract best image URL ──
function extractImage(images: Array<Record<string, string>> | undefined): string | undefined {
  if (!images || !Array.isArray(images)) return undefined;
  // Prefer extralarge > large > medium > small
  const sizes = ['extralarge', 'large', 'medium', 'small'];
  for (const size of sizes) {
    const img = images.find(i => i.size === size);
    if (img?.['#text']) return img['#text'];
  }
  return images[images.length - 1]?.['#text'] || undefined;
}
