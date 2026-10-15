'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './layout.module.css';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Verify session via auth API
    fetch('/api/auth')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          router.push('/');
        }
      })
      .catch(() => {
        router.push('/');
      });
  }, [router]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/local', { method: 'DELETE' });
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/dashboard/interview', label: 'Taste Interview', icon: '🎵' },
    { href: '/dashboard/profile', label: 'Taste Profile', icon: '🧠' },
    { href: '/dashboard/playlists', label: 'Playlists', icon: '🎧' },
  ];

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        minHeight: '100vh', gap: 'var(--space-md)' 
      }}>
        <div className="spinner spinner-lg" />
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
