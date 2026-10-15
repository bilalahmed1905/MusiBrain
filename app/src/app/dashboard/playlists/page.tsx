'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

interface PlatformLinks {
  spotify?: string;
  appleMusic?: string;
  youtubeMusic?: string;
  youtube?: string;
  tidal?: string;
  amazonMusic?: string;
}

interface PlaylistTrack {
  name: string;
  artist: string;
  reason: string;
  platformLinks: PlatformLinks;
  thumbnailUrl?: string;
  songLinkUrl?: string;
}

interface Playlist {
  id: string;
  context: string;
  name: string;
  description: string;
  tracks: PlaylistTrack[];
  fromCache?: boolean;
  createdAt: string;
}

const CONTEXTS = [
  { id: 'general', title: 'General Recommendations', icon: '✨', desc: 'A curated mix based entirely on your newly built taste brain', gradient: 'linear-gradient(135deg, #1a3e3e, #1b2d4e)' },
  { id: 'late-night-drive', title: 'Late Night Drive', icon: '🌙', desc: 'Moody, atmospheric tracks for nocturnal cruising', gradient: 'linear-gradient(135deg, #1a1a3e, #2d1b4e)' },
  { id: 'studying', title: 'Studying / Deep Focus', icon: '📚', desc: 'Focused atmosphere without demanding attention', gradient: 'linear-gradient(135deg, #1a2e1a, #1b3d4e)' },
  { id: 'gym', title: 'Gym / Workout', icon: '🔥', desc: 'High energy, strong rhythm, relentless momentum', gradient: 'linear-gradient(135deg, #3e1a1a, #4e2d1b)' },
  { id: 'party', title: 'Party Mode', icon: '🎉', desc: 'Crowd-pleasing bangers and groove-heavy tracks', gradient: 'linear-gradient(135deg, #3e1a3e, #4e1b2d)' },
];

const PLATFORM_INFO: Record<string, { label: string; color: string; className: string }> = {
  spotify: { label: '● Spotify', color: 'var(--spotify-green)', className: 'spotify' },
  appleMusic: { label: '● Apple Music', color: 'var(--apple-pink)', className: 'apple' },
  youtubeMusic: { label: '● YouTube Music', color: 'var(--youtube-red)', className: 'youtube' },
  tidal: { label: '● Tidal', color: 'var(--tidal-blue)', className: '' },
  amazonMusic: { label: '● Amazon', color: 'var(--amazon-orange)', className: '' },
};

function PlaylistsContent() {
  const searchParams = useSearchParams();
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [savedPlaylists, setSavedPlaylists] = useState<Playlist[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [hasProfile, setHasProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  // New State for Feedback and Export
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [renameError, setRenameError] = useState('');
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    fetch('/api/auth')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          checkProfile();
          loadSavedPlaylists();
        } else {
          setLoadingProfile(false);
        }
      });

    const contextParam = searchParams.get('context');
    if (contextParam) {
      setActiveContext(contextParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeContext && hasProfile) {
      generatePlaylist(activeContext);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContext, hasProfile]);

  useEffect(() => {
    if (playlist) {
      setRenameName(playlist.name);
      setShowRename(false);
      setRenameError('');
    }
  }, [playlist]);

  const checkProfile = async () => {
    try {
      const res = await fetch('/api/taste-profile');
      const data = await res.json();
      setHasProfile(!!data.profile);
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadSavedPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists');
      const data = await res.json();
      setSavedPlaylists(data.playlists || []);
    } catch {
      setSavedPlaylists([]);
    }
  };

  const generatePlaylist = async (context: string, forceRegenerate = false) => {
    setIsGenerating(true);
    setError('');
    setPlaylist(null);

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, forceRegenerate }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setPlaylist(data.playlist);
        setExportUrl(null); // Reset export url
        setExportError('');
        loadSavedPlaylists();
      }
    } catch {
      setError('Failed to generate playlist. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToYTMusic = async () => {
    if (!playlist) return;
    setIsExporting(true);
    setExportError('');
    try {
      const res = await fetch('/api/export/ytmusic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId: playlist.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Export failed');
      setExportUrl(data.playlistUrl);
    } catch (err: any) {
      setExportError(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const savePlaylistName = async () => {
    if (!playlist) return;
    const trimmed = renameName.trim();
    if (!trimmed) {
      setRenameError('Playlist name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setRenameError('');
    try {
      const res = await fetch('/api/playlists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId: playlist.id, name: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRenameError(data.error || 'Failed to rename playlist');
        return;
      }

      setPlaylist(data.playlist);
      setShowRename(false);
      loadSavedPlaylists();
    } catch {
      setRenameError('Failed to rename playlist');
    } finally {
      setIsSaving(false);
    }
  };

  const openSavedPlaylist = (saved: Playlist) => {
    setPlaylist(saved);
    setActiveContext(null);
    setExportUrl(null);
    setExportError('');
  };

  const handleFeedback = async (track: PlaylistTrack, type: string) => {
    const trackKey = `${track.name}::${track.artist}`;
    setFeedbacks(prev => ({ ...prev, [trackKey]: type }));
    
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: trackKey,
          trackName: track.name,
          artistName: track.artist,
          feedbackType: type,
        }),
      });
    } catch (err) {
      console.error('Failed to log feedback', err);
    }
  };

  const handleCopyTracklist = () => {
    if (!playlist?.tracks) return;
    const text = playlist.tracks.map(t => `${t.artist} - ${t.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopyStatus('Copied!');
    setShowExportModal(true);
    setTimeout(() => setCopyStatus(null), 3000);
  };

  const handleDownloadTxt = () => {
    if (!playlist?.tracks) return;
    const text = playlist.tracks.map(t => `${t.artist} - ${t.name}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (!playlist?.tracks) return;
    const header = 'Track Name,Artist Name,Reason\n';
    const rows = playlist.tracks
      .map(t => `"${t.name.replace(/"/g, '""')}","${t.artist.replace(/"/g, '""')}","${t.reason.replace(/"/g, '""')}"`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingProfile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className={styles.emptyState}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>🎧</div>
        <h2 className="heading-md">Build Your Taste Profile First</h2>
        <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)', maxWidth: 400, lineHeight: 1.6 }}>
          Complete the taste interview and generate your profile before creating playlists.
        </p>
        <Link href="/dashboard/interview" className="btn btn-primary btn-lg">
          Start Taste Interview →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.playlistsPage}>
      <div className="page-header">
        <h1 className="page-title">
          Your <span className="text-gradient">Playlists</span>
        </h1>
        <p className="page-subtitle">
          Choose a context and let your taste brain curate the perfect playlist.
        </p>
      </div>

      {/* Context Selection */}
      {!activeContext && (
        <>
          <div className={styles.contextsGrid}>
            {CONTEXTS.map(ctx => (
              <button
                key={ctx.id}
                className={`context-card ${styles.contextBtn}`}
                style={{ background: ctx.gradient }}
                onClick={() => setActiveContext(ctx.id)}
              >
                <span className="context-icon">{ctx.icon}</span>
                <span className="context-title">{ctx.title}</span>
                <span className="context-desc">{ctx.desc}</span>
              </button>
            ))}
          </div>

          {savedPlaylists.length > 0 && (
            <div className={styles.savedSection}>
              <h2 className="heading-sm">Saved Playlists</h2>
              <div className={styles.savedGrid}>
                {savedPlaylists.map(saved => (
                  <div key={saved.id} className={`card ${styles.savedCard}`}>
                    <div className={styles.savedMeta}>
                      <div className={styles.savedTitle}>{saved.name}</div>
                      <div className={styles.savedSubtitle}>
                        {saved.context.replace(/-/g, ' ')} • {new Date(saved.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => openSavedPlaylist(saved)}>
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Generating State */}
      {isGenerating && (
        <div className={styles.generatingState}>
          <div className={styles.brainAnimation}>
            <span className={styles.brainEmoji}>🧠</span>
            <div className={styles.pulseRing} />
            <div className={styles.pulseRing} style={{ animationDelay: '0.5s' }} />
          </div>
          <h2 className="heading-sm">Building Your Playlist...</h2>
          <p className="text-secondary" style={{ maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
            Discovering similar tracks, analyzing your taste profile, and curating the perfect mix. This usually takes 1-2 minutes.
          </p>
          <div className={styles.generatingSteps}>
            <span className={styles.genStep}>🔍 Finding similar tracks via Last.fm</span>
            <span className={styles.genStep}>🧠 AI curating based on your taste</span>
            <span className={styles.genStep}>🔗 Getting cross-platform links</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={`card ${styles.errorCard}`}>
          <p>⚠️ {error}</p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
            <button className="btn btn-primary btn-sm" onClick={() => activeContext && generatePlaylist(activeContext, true)}>
              Try Again
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setActiveContext(null); setError(''); }}>
              Choose Different Context
            </button>
          </div>
        </div>
      )}

      {/* Playlist Result */}
      {playlist && !isGenerating && (
        <div className={styles.playlistResult}>
          {/* Header */}
          <div className={styles.playlistHeader}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setActiveContext(null); setPlaylist(null); }}>
              ← Back to contexts
            </button>
            <div className={styles.playlistMeta}>
              <h2 className="heading-md">{playlist.name}</h2>
              <p className="text-secondary" style={{ marginTop: 'var(--space-sm)', lineHeight: 1.6 }}>
                {playlist.description}
              </p>
              {playlist.fromCache && (
                <span className="tag tag-teal" style={{ marginTop: 'var(--space-sm)' }}>
                  📦 Cached • Force regenerate for fresh picks
                </span>
              )}
            </div>
            <div className={styles.playlistActions} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCopyTracklist}
                title="Copy tracklist for Apple Music / Spotify"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copyStatus ? '✓ Copied to Clipboard!' : '📋 Copy Tracklist (Apple/Spotify)'}
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => activeContext && generatePlaylist(activeContext, true)}
                disabled={isExporting}
              >
                🔄 Regenerate
              </button>

              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowRename(prev => !prev)}
                disabled={isSaving}
              >
                💾 Save / Rename
              </button>
              
              {!exportUrl ? (
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={exportToYTMusic} 
                  disabled={isExporting}
                  style={{ color: 'var(--youtube-red)' }}
                >
                  {isExporting ? '⏳ Exporting...' : '▶️ Export to YT Music'}
                </button>
              ) : (
                <a href={exportUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ background: 'var(--spotify-green)', border: 'none' }}>
                  🎉 View on YouTube Music
                </a>
              )}
              {exportError && <span style={{ color: 'var(--error-red)', fontSize: '12px' }}>{exportError}</span>}
            </div>
          </div>

          {showExportModal && (
            <div className={`card ${styles.renameCard}`} style={{ borderColor: 'var(--accent)', background: 'rgba(25, 25, 40, 0.95)', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  📋 Tracklist Copied ({playlist.tracks.length} tracks)!
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '2px 8px' }}
                  onClick={() => setShowExportModal(false)}
                >
                  ✕
                </button>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 12px 0', lineHeight: 1.5 }}>
                Paste directly into any free converter to put this playlist right into your <strong>Apple Music</strong> or <strong>Spotify</strong> library:
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <a
                  href="https://www.tunemymusic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  🌐 Open TuneMyMusic (Web) →
                </a>
                <a
                  href="https://songshift.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  📱 SongShift (iOS)
                </a>
                <button className="btn btn-ghost btn-sm" onClick={handleDownloadTxt}>
                  📥 Download .txt
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleDownloadCsv}>
                  📥 Download .csv
                </button>
              </div>
            </div>
          )}

          {showRename && (
            <div className={`card ${styles.renameCard}`}>
              <div className={styles.renameRow}>
                <input
                  className="input"
                  value={renameName}
                  onChange={e => setRenameName(e.target.value)}
                  placeholder="Playlist name"
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={savePlaylistName}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
              {renameError && <div className={styles.renameError}>{renameError}</div>}
            </div>
          )}

          {/* Track List */}
          <div className={styles.trackList}>
            {playlist.tracks.map((track, i) => (
              <div key={i} className={`card ${styles.trackCard}`}>
                <div className={styles.trackNumber}>{String(i + 1).padStart(2, '0')}</div>
                <div className={styles.trackMain}>
                  <div className={styles.trackDetails}>
                    <span className={styles.trackTitle}>{track.name}</span>
                    <span className={styles.trackArtist}>{track.artist}</span>
                  </div>
                  {track.reason && (
                    <p className={styles.trackReason}>
                      &ldquo;{track.reason}&rdquo;
                    </p>
                  )}
                  {/* Platform links */}
                  <div className="platform-links">
                    {Object.entries(track.platformLinks || {}).map(([platform, url]) => {
                      if (!url) return null;
                      const info = PLATFORM_INFO[platform];
                      if (!info) return null;
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`platform-link ${info.className}`}
                        >
                          <span style={{ color: info.color }}>{info.label}</span>
                        </a>
                      );
                    })}
                  </div>
                  
                  {/* Track Feedback Section */}
                  <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '8px' }}>Feedback:</span>
                    {[
                      { id: 'wow_so_good', label: '🤯 Wow, so good' },
                      { id: 'nailed_it', label: '🎯 Nailed it' },
                      { id: 'kinda_mid', label: '😐 Kinda mid / not quite it' },
                      { id: 'already_have', label: '🔄 Already have this' },
                      { id: 'failed_it', label: '❌ Failed it' },
                    ].map(btn => {
                      const isActive = feedbacks[`${track.name}::${track.artist}`] === btn.id;
                      return (
                        <button
                          key={btn.id}
                          onClick={() => handleFeedback(track, btn.id)}
                          style={{
                            background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                            border: isActive ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlaylistsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="spinner spinner-lg" />
      </div>
    }>
      <PlaylistsContent />
    </Suspense>
  );
}
