'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface SearchResult {
  name: string;
  artist: string;
  album?: string;
  albumArt?: string;
  tags?: string[];
}

interface Favourite {
  id: string;
  trackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArt?: string;
  loveReason: string;
  moodAnswer: string;
  tags: string[];
  isFinalized: boolean;
  orderIndex: number;
}

const AVAILABLE_TAGS = [
  'lyrics', 'nostalgic', 'hype', 'sad but hopeful', 'cinematic',
  'background', 'focus', 'party', 'melancholy', 'uplifting',
  'raw', 'dreamy', 'aggressive', 'atmospheric', 'groovy',
];

export default function InterviewPage() {
  const router = useRouter();
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTrack, setActiveTrack] = useState<Favourite | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          loadFavourites();
        } else {
          router.push('/');
        }
      });
  }, []);

  const loadFavourites = async () => {
    const res = await fetch('/api/favourites');
    const data = await res.json();
    setFavourites(data.favourites || []);
  };

  // Debounced search
  const searchTracks = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.tracks || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchTracks(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchTracks]);

  const addFavourite = async (track: SearchResult) => {
    if (favourites.length >= 10) {
      setError('Maximum 10 favourites allowed');
      return;
    }

    try {
      const res = await fetch('/api/favourites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackName: track.name,
          artistName: track.artist,
          albumName: track.album || '',
          albumArt: track.albumArt || '',
        }),
      });
      const data = await res.json();
      if (data.favourite) {
        setFavourites(prev => [...prev, data.favourite]);
        setSearchQuery('');
        setSearchResults([]);
        setError('');
      }
    } catch {
      setError('Failed to add track');
    }
  };

  const removeFavourite = async (id: string) => {
    await fetch(`/api/favourites?id=${id}`, { method: 'DELETE' });
    setFavourites(prev => prev.filter(f => f.id !== id));
    if (activeTrack?.id === id) setActiveTrack(null);
  };

  const saveFavouriteAnswers = async () => {
    if (!activeTrack) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/favourites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeTrack.id,
          loveReason: activeTrack.loveReason,
          moodAnswer: activeTrack.moodAnswer,
          tags: activeTrack.tags,
          isFinalized: activeTrack.loveReason.length > 0 && activeTrack.moodAnswer.length > 0,
        }),
      });
      const data = await res.json();
      if (data.favourite) {
        setFavourites(prev => prev.map(f => f.id === data.favourite.id ? data.favourite : f));
        // Move to next unanswered track
        const currentIdx = favourites.findIndex(f => f.id === activeTrack.id);
        const next = favourites.find((f, i) => i > currentIdx && !f.isFinalized);
        if (next) setActiveTrack(next);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const generateProfile = async () => {
    const finalized = favourites.filter(f => f.isFinalized);
    if (finalized.length < 5) {
      setError('Answer questions for at least 5 songs before generating your profile');
      return;
    }

    setIsGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/taste-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        router.push('/dashboard/playlists?context=general');
      }
    } catch {
      setError('Failed to generate taste profile. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (!activeTrack) return;
    const tags = activeTrack.tags.includes(tag)
      ? activeTrack.tags.filter(t => t !== tag)
      : [...activeTrack.tags, tag];
    setActiveTrack({ ...activeTrack, tags });
  };

  const finalizedCount = favourites.filter(f => f.isFinalized).length;
  const progress = Math.min((finalizedCount / 5) * 100, 100);

  return (
    <div className={styles.interview}>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          Taste <span className="text-gradient">Interview</span>
        </h1>
        <p className="page-subtitle">
          Pick your favourite songs and tell us why they matter to you.
        </p>
      </div>

      {/* Progress */}
      <div className={styles.progressSection}>
        <div className={styles.progressInfo}>
          <span>{finalizedCount}/5+ songs answered</span>
          <span className="text-muted">{favourites.length} selected</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.interviewGrid}>
        {/* Left: Song Selection */}
        <div className={styles.selectionPanel}>
          {/* Search */}
          <div className={styles.searchBox}>
            <input
              className="input"
              type="text"
              placeholder="🔍 Search for a song..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {isSearching && (
              <div className={styles.searchSpinner}>
                <div className="spinner" />
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map((track, i) => {
                const alreadyAdded = favourites.some(
                  f => f.trackId === `${track.artist}::${track.name}`.toLowerCase()
                );
                return (
                  <div
                    key={i}
                    className={`track-card ${alreadyAdded ? 'selected' : ''}`}
                    onClick={() => !alreadyAdded && addFavourite(track)}
                  >
                    {track.albumArt ? (
                      <img src={track.albumArt} alt="" className="track-art" />
                    ) : (
                      <div className="track-art" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎵</div>
                    )}
                    <div className="track-info">
                      <div className="track-name">{track.name}</div>
                      <div className="track-artist">{track.artist}</div>
                    </div>
                    {alreadyAdded ? (
                      <span style={{ color: 'var(--success)', fontSize: 'var(--text-sm)' }}>✓</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xl)' }}>+</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Favourites */}
          <div className={styles.favouritesList}>
            <h3 className={styles.sectionTitle}>
              Your Favourites ({favourites.length}/10)
            </h3>
            {favourites.length === 0 ? (
              <div className={styles.emptyState}>
                <p className="text-muted">Search and add songs that define your taste</p>
              </div>
            ) : (
              favourites.map(fav => (
                <div
                  key={fav.id}
                  className={`track-card ${activeTrack?.id === fav.id ? 'selected' : ''}`}
                  onClick={() => setActiveTrack(fav)}
                >
                  {fav.albumArt ? (
                    <img src={fav.albumArt} alt="" className="track-art" />
                  ) : (
                    <div className="track-art" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎵</div>
                  )}
                  <div className="track-info">
                    <div className="track-name">{fav.trackName}</div>
                    <div className="track-artist">{fav.artistName}</div>
                  </div>
                  <div className={styles.favStatus}>
                    {fav.isFinalized ? (
                      <span className="tag tag-active" style={{ fontSize: '10px' }}>✓ Done</span>
                    ) : (
                      <span className="tag tag-default" style={{ fontSize: '10px' }}>Pending</span>
                    )}
                    <button
                      className={styles.removeBtn}
                      onClick={e => { e.stopPropagation(); removeFavourite(fav.id); }}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Questions Panel */}
        <div className={styles.questionsPanel}>
          {activeTrack ? (
            <div className={styles.questionForm}>
              <div className={styles.activeTrackHeader}>
                {activeTrack.albumArt ? (
                  <img src={activeTrack.albumArt} alt="" className="track-art track-art-lg" />
                ) : (
                  <div className="track-art track-art-lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎵</div>
                )}
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{activeTrack.trackName}</h3>
                  <p className="text-secondary">{activeTrack.artistName}</p>
                </div>
              </div>

              <div className={styles.questionGroup}>
                <label className={styles.questionLabel}>
                  What do you love about this song?
                  <span className="text-muted" style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}> (1-2 sentences)</span>
                </label>
                <textarea
                  className="input textarea"
                  placeholder="The way the guitar builds slowly into that massive chorus, the raw emotion in the vocals..."
                  value={activeTrack.loveReason}
                  onChange={e => setActiveTrack({ ...activeTrack, loveReason: e.target.value })}
                  maxLength={200}
                />
                <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                  {activeTrack.loveReason.length}/200
                </span>
              </div>

              <div className={styles.questionGroup}>
                <label className={styles.questionLabel}>
                  What mood are you in when you put it on?
                </label>
                <textarea
                  className="input textarea"
                  placeholder="Late at night when I'm feeling reflective, or during a long drive when I want to feel something..."
                  value={activeTrack.moodAnswer}
                  onChange={e => setActiveTrack({ ...activeTrack, moodAnswer: e.target.value })}
                  maxLength={200}
                />
              </div>

              <div className={styles.questionGroup}>
                <label className={styles.questionLabel}>
                  Tags <span className="text-muted" style={{ fontSize: 'var(--text-xs)', fontWeight: 400 }}>(optional)</span>
                </label>
                <div className={styles.tagsGrid}>
                  {AVAILABLE_TAGS.map(tag => (
                    <button
                      key={tag}
                      className={`tag ${activeTrack.tags.includes(tag) ? 'tag-active' : 'tag-default'}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={saveFavouriteAnswers}
                disabled={!activeTrack.loveReason.trim() || !activeTrack.moodAnswer.trim() || isSaving}
              >
                {isSaving ? (
                  <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</>
                ) : (
                  <>Save & Continue →</>
                )}
              </button>
            </div>
          ) : (
            <div className={styles.emptyQuestions}>
              <div style={{ fontSize: '3rem', marginBottom: 'var(--space-lg)' }}>💭</div>
              <h3 style={{ marginBottom: 'var(--space-sm)' }}>Select a song</h3>
              <p className="text-secondary" style={{ maxWidth: 300, lineHeight: 1.6 }}>
                Click on one of your favourites to answer questions about it, or search to add more songs.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.errorBar}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Generate Button */}
      {finalizedCount >= 5 && (
        <div className={styles.generateSection}>
          <div className={`card card-glass ${styles.generateCard}`}>
            <div>
              <h3>Ready to build your taste brain!</h3>
              <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
                You&apos;ve answered questions for {finalizedCount} songs. That&apos;s enough to generate your profile.
              </p>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={generateProfile}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Generating Profile...</>
              ) : (
                <>🧠 Generate My Taste Profile</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
