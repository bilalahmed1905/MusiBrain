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
    // Check for user in localStorage first for instant render
    const stored = localStorage.getItem('musibrain_user');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      // Verify session
      fetch('/api/auth')
        .then(r => r.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('musibrain_user', JSON.stringify(data.user));
          } else {
            router.push('/');
          }
        });
    }
  }, [router]);

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
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.displayName}</div>
            <div className={styles.userEmail}>{user.email || 'Music lover'}</div>
          </div>
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
