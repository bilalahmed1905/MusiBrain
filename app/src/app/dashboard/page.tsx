'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface User {
  id: string;
  displayName: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ favourites: 0, hasProfile: false, playlists: 0 });

  useEffect(() => {
    const stored = localStorage.getItem('musibrain_user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      loadStats(u.id);
    }
  }, []);

  const loadStats = async (userId: string) => {
    try {
      const [favRes, profileRes, playlistRes] = await Promise.all([
        fetch(`/api/favourites?userId=${userId}`),
        fetch(`/api/taste-profile?userId=${userId}`),
        fetch(`/api/playlists?userId=${userId}`),
      ]);
      const [favData, profileData, playlistData] = await Promise.all([
        favRes.json(),
        profileRes.json(),
        playlistRes.json(),
      ]);
      setStats({
        favourites: favData.favourites?.length || 0,
        hasProfile: !!profileData.profile,
        playlists: playlistData.playlists?.length || 0,
      });
    } catch {
      // Stats are non-critical
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const steps = [
    {
      title: 'Pick Your Favourites',
      description: 'Search and select 5-10 songs that define your taste',
      icon: '🎵',
      href: '/dashboard/interview',
      status: stats.favourites >= 5 ? 'complete' : stats.favourites > 0 ? 'in-progress' : 'pending',
      detail: stats.favourites > 0 ? `${stats.favourites}/5+ selected` : 'Not started',
    },
    {
      title: 'Tell Us Why You Love Them',
      description: 'Answer questions about each song to build your taste DNA',
      icon: '💭',
      href: '/dashboard/interview',
      status: stats.favourites >= 5 ? 'complete' : 'pending',
      detail: stats.favourites >= 5 ? 'Ready to finalize' : 'Pick favourites first',
    },
    {
      title: 'Generate Your Taste Profile',
      description: 'AI analyzes your patterns and builds your taste brain',
      icon: '🧠',
      href: '/dashboard/profile',
      status: stats.hasProfile ? 'complete' : 'pending',
      detail: stats.hasProfile ? 'Profile generated' : 'Complete interview first',
    },
    {
      title: 'Get Your Playlists',
      description: 'Context-specific playlists for every moment',
      icon: '🎧',
      href: '/dashboard/playlists',
      status: stats.playlists > 0 ? 'complete' : 'pending',
      detail: stats.playlists > 0 ? `${stats.playlists} playlist${stats.playlists > 1 ? 's' : ''} generated` : 'Build profile first',
    },
  ];

  return (
    <div className={styles.dashboard}>
      <div className="page-header">
        <h1 className="page-title">
          {getGreeting()}, <span className="text-gradient">{user?.displayName || 'there'}</span>
        </h1>
        <p className="page-subtitle">
          {stats.hasProfile
            ? 'Your taste brain is ready. Generate some playlists!'
            : 'Let\'s build your taste brain. Start with the interview.'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className={styles.stepsSection}>
        <h2 className="heading-sm" style={{ marginBottom: 'var(--space-lg)' }}>Your Journey</h2>
        <div className={styles.stepsGrid}>
          {steps.map((step, i) => (
            <Link key={i} href={step.href} className={`card card-glow ${styles.stepCard} ${styles[step.status]}`}>
              <div className={styles.stepHeader}>
                <span className={styles.stepIcon}>{step.icon}</span>
                <span className={`tag ${step.status === 'complete' ? 'tag-active' : step.status === 'in-progress' ? 'tag-teal' : 'tag-default'}`}>
                  {step.status === 'complete' ? '✓ Done' : step.status === 'in-progress' ? '⏳ In Progress' : `Step ${i + 1}`}
                </span>
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>
              <span className={styles.stepDetail}>{step.detail}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      {stats.hasProfile && (
        <div className={styles.quickActions}>
          <h2 className="heading-sm" style={{ marginBottom: 'var(--space-lg)' }}>Quick Actions</h2>
          <div className="grid-4">
            <Link href="/dashboard/playlists?context=late-night-drive" className={`card ${styles.contextQuick}`} style={{ background: 'linear-gradient(135deg, #1a1a3e, #2d1b4e)' }}>
              <span style={{ fontSize: '1.5rem' }}>🌙</span>
              <span>Late Night Drive</span>
            </Link>
            <Link href="/dashboard/playlists?context=studying" className={`card ${styles.contextQuick}`} style={{ background: 'linear-gradient(135deg, #1a2e1a, #1b3d4e)' }}>
              <span style={{ fontSize: '1.5rem' }}>📚</span>
              <span>Studying</span>
            </Link>
            <Link href="/dashboard/playlists?context=gym" className={`card ${styles.contextQuick}`} style={{ background: 'linear-gradient(135deg, #3e1a1a, #4e2d1b)' }}>
              <span style={{ fontSize: '1.5rem' }}>🔥</span>
              <span>Gym</span>
            </Link>
            <Link href="/dashboard/playlists?context=party" className={`card ${styles.contextQuick}`} style={{ background: 'linear-gradient(135deg, #3e1a3e, #4e1b2d)' }}>
              <span style={{ fontSize: '1.5rem' }}>🎉</span>
              <span>Party</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
