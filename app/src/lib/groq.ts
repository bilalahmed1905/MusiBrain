// Groq LLM Service
// Uses Llama 4 Scout via Groq for taste analysis, playlist curation, and blurbs

import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

function getGroq(): Groq {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      throw new Error('GROQ_API_KEY is not configured. Get one at https://console.groq.com');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

interface FavouriteInput {
  trackName: string;
  artistName: string;
  loveReason: string;
  moodAnswer: string;
  tags: string[];
}

// ── Generate Taste Profile ──
export interface TasteProfileResult {
  semanticTags: string[];
  moods: string[];
  summaryText: string;
  internalNotes: string;
  tagIntensities: Record<string, number>;
}

export async function generateTasteProfile(favourites: FavouriteInput[]): Promise<TasteProfileResult> {
  const groq = getGroq();

  const favouriteDescriptions = favourites.map((f, i) =>
    `${i + 1}. "${f.trackName}" by ${f.artistName}
   Why they love it: ${f.loveReason}
   Mood when playing: ${f.moodAnswer}
   Tags: ${f.tags.join(', ') || 'none selected'}`
  ).join('\n\n');

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are MusiBrain's taste analyst — a perceptive music critic who understands the emotional and structural patterns behind why people love certain songs. You never use generic clichés like "this song is a vibe" or "it hits different." Instead, you identify specific sonic, emotional, and structural patterns.

Your job: analyze a user's favourite songs and their written reasons to build a rich taste profile.

You MUST respond with valid JSON matching this exact structure:
{
  "semanticTags": ["3-8 specific descriptive tags like 'melancholy indie with soaring choruses', 'lo-fi warmth with subtle complexity'"],
  "moods": ["3-6 moods like 'reflective solitude', 'quiet determination'"],
  "summaryText": "2-3 paragraphs written directly to the user (use 'you/your'), explaining the emotional and sonic patterns in their taste. Be specific, reference their actual songs and reasons. Make them feel understood.",
  "internalNotes": "Technical notes for playlist generation: preferred structures, energy arcs, instrumentation patterns, lyrical themes, what to emphasize and avoid.",
  "tagIntensities": {"each semantic tag": 0.0-1.0 indicating how strongly it defines their taste}
}`
      },
      {
        role: 'user',
        content: `Here are my ${favourites.length} favourite songs and why I love them:\n\n${favouriteDescriptions}\n\nAnalyze my taste and build my profile.`
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from LLM');

  try {
    const parsed = JSON.parse(content);
    return {
      semanticTags: parsed.semanticTags || [],
      moods: parsed.moods || [],
      summaryText: parsed.summaryText || '',
      internalNotes: parsed.internalNotes || '',
      tagIntensities: parsed.tagIntensities || {},
    };
  } catch {
    throw new Error('Failed to parse taste profile from LLM response');
  }
}

// ── Context Descriptions ──
const CONTEXT_PROMPTS: Record<string, string> = {
  'late-night-drive': 'Emphasize moody, atmospheric tracks with mid-tempo, moderate energy, lower valence. Think nocturnal, cinematic, introspective. Avoid high-energy EDM bangers unless they match user history. Lean into tracks with space, ambience, and emotional weight.',
  'studying': 'Prefer lower speechiness, moderate to low energy, stable tempo, fewer abrupt transitions. Favor tracks that create a focused atmosphere without demanding attention. Instrumental or minimal vocal tracks are ideal unless the user specifically gravitates toward lyrical music for focus.',
  'gym': 'Increase energy and tempo ranges. Pick tracks with strong rhythmic drive and momentum. Allow higher valence and intensity. Think powerful, driving, relentless. Include tracks that build energy and maintain workout momentum.',
  'party': 'High energy, high danceability, positive valence. Mix crowd-pleasing tracks with taste-specific picks. Good groove and rhythm are essential. Include a mix of uptempo bangers and groove-heavy tracks that keep people moving.',
};

// ── Curate Playlist from Candidates ──
export interface CandidateTrack {
  name: string;
  artist: string;
  tags: string[];
  similaritySource?: string; // which favourite it came from
}

export interface CuratedTrack {
  name: string;
  artist: string;
  reason: string;
}

export interface PlaylistCuration {
  tracks: CuratedTrack[];
  playlistDescription: string;
}

export async function curatePlaylist(
  context: string,
  tasteProfile: {
    semanticTags: string[];
    moods: string[];
    summaryText: string;
    internalNotes: string;
  },
  candidates: CandidateTrack[],
  favouriteNames: string[]
): Promise<PlaylistCuration> {
  const groq = getGroq();

  const contextPrompt = CONTEXT_PROMPTS[context] || 'Create a balanced playlist that reflects the user\'s taste.';

  const candidateList = candidates.map((c, i) =>
    `${i + 1}. "${c.name}" by ${c.artist} [tags: ${c.tags.slice(0, 5).join(', ')}]${c.similaritySource ? ` (similar to: ${c.similaritySource})` : ''}`
  ).join('\n');

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are MusiBrain's playlist curator. You create emotionally perfect playlists by deeply understanding a listener's taste profile and adapting it to specific life contexts.

Rules:
1. Select 15-20 tracks from the candidates list ONLY. Do not invent tracks.
2. Create a listening arc: opener → build → peak → cool down → satisfying close
3. Balance familiar artists with discoveries
4. Never cluster more than 2 tracks from the same artist
5. For each track, write a specific 1-2 sentence "why this fits" that references the user's taste
6. Do NOT use generic phrases like "this is a vibe" or "it hits different" — be specific about sonic/emotional qualities

Context for this playlist: ${contextPrompt}

You MUST respond with valid JSON:
{
  "tracks": [
    {"name": "exact track name from candidates", "artist": "exact artist name", "reason": "specific 1-2 sentence explanation"}
  ],
  "playlistDescription": "2-3 sentence description of this playlist for the user, mentioning the context and their taste"
}`
      },
      {
        role: 'user',
        content: `My taste profile:
Tags: ${tasteProfile.semanticTags.join(', ')}
Moods: ${tasteProfile.moods.join(', ')}
Summary: ${tasteProfile.summaryText}
Internal notes: ${tasteProfile.internalNotes}

My favourite songs include: ${favouriteNames.join(', ')}

Context: ${context}

Candidate tracks to choose from (pick 15-20):
${candidateList}

Curate my playlist.`
      }
    ],
    temperature: 0.8,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from LLM');

  try {
    const parsed = JSON.parse(content);
    return {
      tracks: parsed.tracks || [],
      playlistDescription: parsed.playlistDescription || '',
    };
  } catch {
    throw new Error('Failed to parse playlist curation from LLM response');
  }
}

// ── Get available contexts ──
export function getContexts() {
  return [
    {
      id: 'general',
      title: 'General Recommendations',
      icon: '✨',
      description: 'A curated mix based entirely on your newly built taste brain',
      gradient: 'linear-gradient(135deg, #1a3e3e, #1b2d4e)',
    },
    {
      id: 'late-night-drive',
      title: 'Late Night Drive',
      icon: '🌙',
      description: 'Moody, atmospheric tracks for nocturnal cruising',
      gradient: 'linear-gradient(135deg, #1a1a3e, #2d1b4e)',
    },
    {
      id: 'studying',
      title: 'Studying / Deep Focus',
      icon: '📚',
      description: 'Focused atmosphere without demanding your attention',
      gradient: 'linear-gradient(135deg, #1a2e1a, #1b3d4e)',
    },
    {
      id: 'gym',
      title: 'Gym / Workout',
      icon: '🔥',
      description: 'High energy, strong rhythm, relentless momentum',
      gradient: 'linear-gradient(135deg, #3e1a1a, #4e2d1b)',
    },
    {
      id: 'party',
      title: 'Party Mode',
      icon: '🎉',
      description: 'Crowd-pleasing bangers and groove-heavy tracks',
      gradient: 'linear-gradient(135deg, #3e1a3e, #4e1b2d)',
    },
  ];
}
