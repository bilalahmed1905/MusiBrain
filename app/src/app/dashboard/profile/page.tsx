'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface TasteProfile {
  semanticTags: string[];
  moods: string[];
  summaryText: string;
  tagIntensities: Record<string, number>;
  lastUpdated: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('musibrain_user');
    if (stored) {
      const u = JSON.parse(stored);
      setUserId(u.id);
      loadProfile(u.id);
    }
  }, []);

  const loadProfile = async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/taste-profile?userId=${uid}`);
      const data = await res.json();
      setProfile(data.profile);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = async (tag: string) => {
    if (!profile) return;
    const newTags = profile.semanticTags.includes(tag)
      ? profile.semanticTags.filter(t => t !== tag)
      : [...profile.semanticTags, tag];
    
    const newIntensities = { ...profile.tagIntensities };
    if (!newTags.includes(tag)) {
      delete newIntensities[tag];
    }

    await fetch('/api/taste-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, semanticTags: newTags, tagIntensities: newIntensities }),
    });

    setProfile({ ...profile, semanticTags: newTags, tagIntensities: newIntensities });
  };

  const saveSummary = async () => {
    await fetch('/api/taste-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, summaryText: summaryDraft }),
    });
    setProfile(prev => prev ? { ...prev, summaryText: summaryDraft } : null);
    setEditingSummary(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.emptyProfile}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>🧠</div>
        <h2 className="heading-md">No Taste Profile Yet</h2>
        <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)', maxWidth: 400, lineHeight: 1.6 }}>
          Complete the taste interview first — pick your favourite songs and tell us why you love them.
        </p>
        <Link href="/dashboard/interview" className="btn btn-primary btn-lg">
          Start Taste Interview →
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <div className="page-header">
        <h1 className="page-title">
          Your Taste <span className="text-gradient">Brain</span>
        </h1>
        <p className="page-subtitle">
          Here&apos;s what makes your music taste uniquely yours.
        </p>
      </div>

      {/* Summary */}
      <div className={`card ${styles.summaryCard}`}>
        <div className={styles.summaryHeader}>
          <h2 className="heading-sm">🧠 Taste Profile Summary</h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setEditingSummary(!editingSummary);
              setSummaryDraft(profile.summaryText);
            }}
          >
            {editingSummary ? 'Cancel' : '✏️ Edit'}
          </button>
        </div>
        {editingSummary ? (
          <div>
            <textarea
              className="input textarea"
              style={{ minHeight: 150 }}
              value={summaryDraft}
              onChange={e => setSummaryDraft(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" style={{ marginTop: 'var(--space-md)' }} onClick={saveSummary}>
              Save Changes
            </button>
          </div>
        ) : (
          <div className={styles.summaryText}>
            {profile.summaryText.split('\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}
      </div>

      <div className="grid-2" style={{ marginTop: 'var(--space-xl)' }}>
        {/* Semantic Tags */}
        <div className={`card ${styles.tagsCard}`}>
          <h3 className={styles.cardTitle}>🏷️ Taste Tags</h3>
          <p className="text-muted" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-md)' }}>
            Toggle tags to adjust how they influence your playlists
          </p>
          <div className={styles.tagsContainer}>
            {profile.semanticTags.map(tag => (
              <button
                key={tag}
                className={`tag tag-active ${styles.profileTag}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
                {profile.tagIntensities[tag] && (
                  <span className={styles.tagIntensity}>
                    {Math.round(profile.tagIntensities[tag] * 100)}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Moods */}
        <div className={`card ${styles.moodsCard}`}>
          <h3 className={styles.cardTitle}>🌊 Core Moods</h3>
          <p className="text-muted" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-md)' }}>
            The emotional currents running through your music taste
          </p>
          <div className={styles.moodsList}>
            {profile.moods.map(mood => (
              <div key={mood} className={styles.moodItem}>
                <span className={styles.moodDot} />
                <span>{mood}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tag Intensities Visualization */}
      <div className={`card ${styles.vizCard}`} style={{ marginTop: 'var(--space-xl)' }}>
        <h3 className={styles.cardTitle}>📊 Taste Distribution</h3>
        <div className={styles.intensityBars}>
          {Object.entries(profile.tagIntensities)
            .sort(([, a], [, b]) => b - a)
            .map(([tag, intensity]) => (
              <div key={tag} className="feature-slider">
                <span className="feature-label">{tag}</span>
                <div className="feature-bar">
                  <div className="feature-fill" style={{ width: `${intensity * 100}%` }} />
                </div>
                <span className="feature-value">{Math.round(intensity * 100)}%</span>
              </div>
            ))}
        </div>
      </div>

      {/* CTA to playlists */}
      <div className={styles.ctaSection}>
        <Link href="/dashboard/playlists" className="btn btn-primary btn-lg">
          🎧 Generate Playlists from Your Taste Brain →
        </Link>
      </div>
    </div>
  );
}
