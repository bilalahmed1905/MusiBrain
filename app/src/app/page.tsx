'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState<'google' | 'email' | null>(null);
  const [authMessage, setAuthMessage] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get('auth');
      const reason = params.get('reason') || params.get('err');
      if (auth) {
        setShowLogin(true);
        if (reason) {
          setAuthMessage(`Authentication error: ${decodeURIComponent(reason)}`);
        } else {
          setAuthMessage('Sign in could not be completed. Please try again.');
        }
      }
    }
  }, []);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setAuthMessage('Sign in is currently initializing. Please refresh and try again.');
      return;
    }

    setIsLoading('google');
    setAuthMessage('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setAuthMessage(error.message);
        setIsLoading(null);
      }
    } catch {
      setAuthMessage('Could not connect to authentication service. Please try again.');
      setIsLoading(null);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim()) return;
    if (!supabase) {
      setAuthMessage('Sign in is currently initializing. Please refresh and try again.');
      return;
    }

    setIsLoading('email');
    setAuthMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setAuthMessage(error.message);
      } else {
        setAuthMessage('Check your email for a magic link to finish signing in.');
      }
    } catch {
      setAuthMessage('Could not connect to authentication service. Please try again.');
    }

    setIsLoading(null);
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
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowLogin(true)}
          >
            Sign In
          </button>
        </div>
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
              disabled={isLoading !== null}
            >
              Launch Your Taste Brain →
            </button>
            <a 
              href="#how-it-works"
              className="btn btn-ghost btn-lg"
            >
              How It Works
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
              Sign in to save your taste brain and playlists.
            </p>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={handleGoogleLogin}
              disabled={isLoading !== null}
            >
              {isLoading === 'google' ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Redirecting...</>
              ) : (
                <>Continue with Google →</>
              )}
            </button>

            <div className={styles.formGroup} style={{ marginTop: 'var(--space-lg)' }}>
              <label className={styles.label}>Email Magic Link</label>
              <input
                className="input"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
              />
            </div>

            <button
              className="btn btn-ghost btn-lg"
              style={{ width: '100%', marginTop: 'var(--space-md)' }}
              onClick={handleEmailLogin}
              disabled={!email.trim() || isLoading !== null}
            >
              {isLoading === 'email' ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Sending link...</>
              ) : (
                <>Email me a magic link →</>
              )}
            </button>

            {authMessage && (
              <p className="text-secondary" style={{ marginTop: 'var(--space-md)', fontSize: 'var(--text-sm)', color: '#ffb3ba' }}>
                {authMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
