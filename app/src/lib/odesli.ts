// Odesli (Songlink) API Service
// Converts a song on one platform to links on ALL platforms

const ODESLI_BASE = 'https://api.song.link/v1-alpha.1/links';

export interface PlatformLinks {
  spotify?: string;
  appleMusic?: string;
  youtubeMusic?: string;
  youtube?: string;
  tidal?: string;
  amazonMusic?: string;
  soundcloud?: string;
  deezer?: string;
}

export interface SongLinkResult {
  pageUrl: string; // Universal song.link URL
  platformLinks: PlatformLinks;
  title?: string;
  artist?: string;
  thumbnailUrl?: string;
}

// Rate limiting: Odesli allows ~10 requests per minute
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 6500; // ~9 requests per minute to stay safe

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
  return fetch(url);
}

// Get cross-platform links for a song by searching with artist + track name
export async function getSongLinks(artist: string, trackName: string): Promise<SongLinkResult | null> {
  try {
    // First try searching YouTube Music (most universal)
    const searchQuery = encodeURIComponent(`${artist} ${trackName}`);
    const ytSearchUrl = `https://music.youtube.com/search?q=${searchQuery}`;
    
    // Use the Odesli API with a search-based approach
    const params = new URLSearchParams({
      platform: 'youtube',
      type: 'song',
      title: trackName,
      artist: artist,
    });

    // Try direct URL approach with a YouTube search
    const url = `${ODESLI_BASE}?${params.toString()}`;
    const res = await rateLimitedFetch(url);
    
    if (!res.ok) {
      // Fall back to constructing links manually
      return constructManualLinks(artist, trackName);
    }

    const data = await res.json();
    return parseOdesliResponse(data);
  } catch {
    return constructManualLinks(artist, trackName);
  }
}

// Get cross-platform links from a known platform URL
export async function getSongLinksFromUrl(platformUrl: string): Promise<SongLinkResult | null> {
  try {
    const url = `${ODESLI_BASE}?url=${encodeURIComponent(platformUrl)}`;
    const res = await rateLimitedFetch(url);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return parseOdesliResponse(data);
  } catch {
    return null;
  }
}

function parseOdesliResponse(data: Record<string, unknown>): SongLinkResult {
  const linksByPlatform = data.linksByPlatform as Record<string, Record<string, string>> || {};
  
  return {
    pageUrl: data.pageUrl as string || '',
    platformLinks: {
      spotify: linksByPlatform.spotify?.url,
      appleMusic: linksByPlatform.appleMusic?.url,
      youtubeMusic: linksByPlatform.youtubeMusic?.url,
      youtube: linksByPlatform.youtube?.url,
      tidal: linksByPlatform.tidal?.url,
      amazonMusic: linksByPlatform.amazonMusic?.url,
      soundcloud: linksByPlatform.soundcloud?.url,
      deezer: linksByPlatform.deezer?.url,
    },
    title: extractEntityTitle(data),
    artist: extractEntityArtist(data),
    thumbnailUrl: extractThumbnail(data),
  };
}

function extractEntityTitle(data: Record<string, unknown>): string | undefined {
  const entities = data.entitiesByUniqueId as Record<string, Record<string, string>> | undefined;
  if (!entities) return undefined;
  const firstEntity = Object.values(entities)[0];
  return firstEntity?.title;
}

function extractEntityArtist(data: Record<string, unknown>): string | undefined {
  const entities = data.entitiesByUniqueId as Record<string, Record<string, string>> | undefined;
  if (!entities) return undefined;
  const firstEntity = Object.values(entities)[0];
  return firstEntity?.artistName;
}

function extractThumbnail(data: Record<string, unknown>): string | undefined {
  const entities = data.entitiesByUniqueId as Record<string, Record<string, string>> | undefined;
  if (!entities) return undefined;
  const firstEntity = Object.values(entities)[0];
  return firstEntity?.thumbnailUrl;
}

// Fallback: construct search URLs manually when Odesli fails
function constructManualLinks(artist: string, trackName: string): SongLinkResult {
  const query = encodeURIComponent(`${artist} ${trackName}`);
  
  return {
    pageUrl: '',
    platformLinks: {
      spotify: `https://open.spotify.com/search/${query}`,
      appleMusic: `https://music.apple.com/search?term=${query}`,
      youtubeMusic: `https://music.youtube.com/search?q=${query}`,
      youtube: `https://www.youtube.com/results?search_query=${query}`,
      tidal: `https://tidal.com/search?q=${query}`,
      amazonMusic: `https://music.amazon.com/search/${query}`,
      deezer: `https://www.deezer.com/search/${query}`,
    },
    title: trackName,
    artist: artist,
  };
}

// Batch process: get links for multiple tracks (with rate limiting built in)
export async function batchGetSongLinks(
  tracks: { artist: string; name: string }[]
): Promise<Map<string, SongLinkResult>> {
  const results = new Map<string, SongLinkResult>();
  
  for (const track of tracks) {
    const key = `${track.artist}::${track.name}`;
    const result = await getSongLinks(track.artist, track.name);
    if (result) {
      results.set(key, result);
    }
  }
  
  return results;
}
