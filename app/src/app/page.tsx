'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function LandingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleStart = async () => {
    if (!name.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name.trim(), email: email.trim() || undefined }),
      });

      const data = await res.json();
      if (data.user) {
        localStorage.setItem('musibrain_user', JSON.stringify(data.user));
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.landing}>
      {/* Animated background orbs */}
      <div className={styles.bgOrbs}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🧠</span>
          <span className={styles.logoText}>MusiBrain</span>
        </div>
        <button 
          className="btn btn-ghost" 
          onClick={() => setShowLogin(true)}
        >
          Get Started
        </button>
      </nav>

      {/* Hero */}
      <main className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={`${styles.badge} fade-in`}>
            <span className={styles.badgeDot} />
            AI-Powered Music Understanding
          </div>
          
          <h1 className={`heading-xl ${styles.heroTitle} fade-in stagger-1`}>
            Your Music Taste,<br />
            <span className="text-gradient">Finally Understood</span>
          </h1>
          
          <p className={`${styles.heroSubtitle} fade-in stagger-2`}>
            MusiBrain doesn&apos;t just look at what you listen to — it learns <em>why</em> you 
            love it. Then it builds playlists that feel emotionally perfect for every 
            moment of your life.
          </p>

          <div className={`${styles.heroCtas} fade-in stagger-3`}>
            <button 
              className="btn btn-primary btn-lg" 
              onClick={() => setShowLogin(true)}
            >
              Build Your Taste Brain
              <span>→</span>
            </button>
            <a href="#how-it-works" className="btn btn-ghost btn-lg">
              See How It Works
            </a>
          </div>

          {/* Feature pills */}
          <div className={`${styles.featurePills} fade-in stagger-4`}>
            <span className={styles.pill}>🎵 Works with any platform</span>
            <span className={styles.pill}>🧠 Understands your why</span>
            <span className={styles.pill}>✨ Not just algorithms</span>
          </div>
        </div>
      </main>

      {/* How it works */}
      <section id="how-it-works" className={styles.howSection}>
        <h2 className="heading-md" style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          How <span className="text-gradient">MusiBrain</span> Works
        </h2>
        <div className={styles.steps}>
          <div className={`card card-glass ${styles.step}`}>
            <div className={styles.stepNumber}>01</div>
            <div className={styles.stepIcon}>🎵</div>
            <h3>Pick Your Favourites</h3>
            <p>Search for 5-10 songs that define your taste. Not just what you&apos;ve been streaming — the songs that <em>mean something</em>.</p>
          </div>
          <div className={`card card-glass ${styles.step}`}>
            <div className={styles.stepNumber}>02</div>
            <div className={styles.stepIcon}>💭</div>
            <h3>Tell Us Why</h3>
            <p>For each song, tell us what you love and what mood it puts you in. This is where the magic happens — your words become your taste DNA.</p>
          </div>
          <div className={`card card-glass ${styles.step}`}>
            <div className={styles.stepNumber}>03</div>
            <div className={styles.stepIcon}>🧠</div>
            <h3>AI Builds Your Brain</h3>
            <p>Our AI analyzes the patterns — not just genres, but emotional textures, sonic structures, and the feelings between the notes.</p>
          </div>
          <div className={`card card-glass ${styles.step}`}>
            <div className={styles.stepNumber}>04</div>
            <div className={styles.stepIcon}>🎧</div>
            <h3>Get Perfect Playlists</h3>
            <p>Late-night drive? Deep focus studying? Gym energy? Get playlists that feel <em>emotionally right</em> — with links to every platform.</p>
          </div>
        </div>
      </section>

      {/* Platform strip */}
      <section className={styles.platformSection}>
        <p className={styles.platformLabel}>Listen on your platform</p>
        <div className={styles.platforms}>
          <span className={styles.platformBadge} style={{ color: 'var(--spotify-green)' }}>● Spotify</span>
          <span className={styles.platformBadge} style={{ color: 'var(--apple-pink)' }}>● Apple Music</span>
          <span className={styles.platformBadge} style={{ color: 'var(--youtube-red)' }}>● YouTube Music</span>
          <span className={styles.platformBadge} style={{ color: 'var(--tidal-blue)' }}>● Tidal</span>
          <span className={styles.platformBadge} style={{ color: 'var(--amazon-orange)' }}>● Amazon Music</span>
        </div>
      </section>

      {/* Login Modal */}
      {showLogin && (
        <div className={styles.modalOverlay} onClick={() => setShowLogin(false)}>
          <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
            <h2 className="heading-sm" style={{ marginBottom: 'var(--space-sm)' }}>
              Welcome to <span className="text-gradient">MusiBrain</span>
            </h2>
            <p className="text-secondary" style={{ marginBottom: 'var(--space-xl)', fontSize: 'var(--text-sm)' }}>
              Enter your name to start building your taste brain. No sign-up required.
            </p>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Your Name</label>
              <input
                className="input"
                type="text"
                placeholder="What should we call you?"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
                autoFocus
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Email <span className="text-muted">(optional, for saving progress)</span></label>
              <input
                className="input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleStart()}
              />
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 'var(--space-md)' }}
              onClick={handleStart}
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Setting up...</>
              ) : (
                <>Start My Taste Interview →</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
