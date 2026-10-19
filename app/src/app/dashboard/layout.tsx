'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './layout.module.css';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface User {
  id: string;
  displayName: string;
  email?: string;
  profileImage?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isActivated, setIsActivated] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    // Verify session via auth API
    fetch('/api/auth')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setIsActivated(data.isActivated !== false);
        } else {
          const reason = data.error || 'no_active_session';
          router.push(`/?auth=failed&err=${encodeURIComponent(reason)}`);
        }
      })
      .catch((err) => {
        router.push(`/?auth=failed&err=${encodeURIComponent(err?.message || 'network_error')}`);
      });
  }, [router]);

  const handleSignOut = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      if (supabase) await supabase.auth.signOut();
      await fetch('/api/auth/local', { method: 'DELETE' });
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  const handleVerifyInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setSubmittingInvite(true);
    setInviteError('');

    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.error || 'Invalid code');
      } else {
        setIsActivated(true);
      }
    } catch {
      setInviteError('Failed to verify code. Please try again.');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/dashboard/interview', label: 'Taste Interview', icon: '🎵' },
    { href: '/dashboard/profile', label: 'Taste Profile', icon: '🧠' },
    { href: '/dashboard/playlists', label: 'Playlists', icon: '🎧' },
  ];

  if (!user || isActivated === null) {
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        minHeight: '100vh', gap: 'var(--space-md)' 
      }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  // Invite gatekeeper screen
  if (!isActivated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--space-lg)',
        background: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15) 0%, var(--bg-body) 60%)',
      }}>
        <div className="card" style={{ maxWidth: '440px', width: '100%', textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🔐</div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
            Private Beta Access
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-xl)', lineHeight: 1.5 }}>
            Welcome, <strong>{user.displayName}</strong>! MusiBrain is currently in private preview. Enter your invite code below to unlock your taste brain.
          </p>

          <form onSubmit={handleVerifyInvite} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <input
              type="text"
              placeholder="Enter invite code (e.g. BETA2025)"
              value={inviteCode}
              onChange={e => {
                setInviteCode(e.target.value);
                setInviteError('');
              }}
              className="input"
              style={{ textAlign: 'center', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}
              autoFocus
            />

            {inviteError && (
              <div style={{ color: 'var(--color-danger, #ef4444)', fontSize: 'var(--text-xs)', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: 'var(--radius-md)' }}>
                {inviteError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingInvite || !inviteCode.trim()}
              style={{ width: '100%' }}
            >
              {submittingInvite ? 'Verifying...' : 'Unlock MusiBrain →'}
            </button>
          </form>

          <div style={{ marginTop: 'var(--space-xl)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-md)' }}>
            <button
              onClick={handleSignOut}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Sign out / switch account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Mobile menu toggle */}
      <button 
        className={`${styles.mobileToggle} btn btn-icon btn-secondary`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link href="/dashboard" className="sidebar-logo">
          <span className="logo-icon">🧠</span>
          <span>MusiBrain</span>
        </Link>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>
            {user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user.displayName}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              user.displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className={styles.userInfo} style={{ flex: 1 }}>
            <div className={styles.userName}>{user.displayName}</div>
            <div className={styles.userEmail}>{user.email || 'Music lover'}</div>
          </div>
          <button 
            className="btn btn-ghost" 
            style={{ padding: '4px 8px', fontSize: '12px' }}
            onClick={handleSignOut}
            title="Sign out"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className={styles.mobileOverlay} 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
    </div>
  );
}
