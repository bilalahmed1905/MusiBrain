import prisma from '@/lib/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

export const LOCAL_SESSION_COOKIE = 'musibrain_local_session';

// Fallback default user if dev.db has no users
const DEFAULT_LOCAL_USER = {
  id: 'local-dev-user-0001',
  displayName: 'Music Explorer',
  email: 'explorer@musibrain.app',
  profileImage: null,
};

export async function getLocalUser() {
  try {
    const existing = await prisma.user.findFirst({
      where: { id: DEFAULT_LOCAL_USER.id },
    });
    if (existing) return existing;

    const anyUser = await prisma.user.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (anyUser) return anyUser;

    return await prisma.user.create({
      data: DEFAULT_LOCAL_USER,
    });
  } catch (err) {
    console.error('Error fetching local fallback user:', err);
    return DEFAULT_LOCAL_USER;
  }
}

function getDisplayName(user: User): string {
  const metadata = user.user_metadata || {};
  return (
    metadata.full_name ||
    metadata.name ||
    user.email ||
    'Music lover'
  );
}

function getProfileImage(user: User): string | null {
  const metadata = user.user_metadata || {};
  return metadata.avatar_url || metadata.picture || null;
}

export async function getServerUser() {
  // 1. Check if user is logged into local session
  try {
    const cookieStore = await cookies();
    const hasLocalSession = cookieStore.get(LOCAL_SESSION_COOKIE)?.value;
    const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';

    if (hasLocalSession === 'true' || isLocalMode) {
      const localUser = await getLocalUser();
      const mockSupabaseUser: User = {
        id: localUser.id,
        app_metadata: {},
        user_metadata: {
          full_name: localUser.displayName,
          avatar_url: localUser.profileImage,
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: localUser.email || undefined,
      } as unknown as User;

      return { user: mockSupabaseUser, error: null };
    }
  } catch {
    // cookies() can throw in some build/prerender environments
  }

  // 2. Otherwise try Supabase Server Client
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return { user: null, error: new Error('Supabase client not configured') };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return { user: null, error };
    }
    return { user: data.user, error: null };
  } catch (err) {
    return { user: null, error: err };
  }
}

export async function requireUserId() {
  const { user } = await getServerUser();
  if (!user) return null;
  await ensureDbUser(user);
  return user.id;
}

export async function ensureDbUser(user: User) {
  const displayName = getDisplayName(user);
  const profileImage = getProfileImage(user);
  const email = user.email || null;

  let safeEmail: string | null = email;
  if (email) {
    const existingByEmail = await prisma.user.findFirst({ where: { email } });
    if (existingByEmail && existingByEmail.id !== user.id) {
      safeEmail = null;
    }
  }

  const isAdmin = email === 'bilalahmed1905@gmail.com' || !process.env.INVITE_CODE;

  const existingById = await prisma.user.findUnique({ where: { id: user.id } });
  if (existingById) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        displayName,
        ...(safeEmail ? { email: safeEmail } : {}),
        profileImage,
        ...(isAdmin && !existingById.isActivated ? { isActivated: true } : {}),
      },
    });
  }

  return prisma.user.create({
    data: {
      id: user.id,
      displayName,
      email: safeEmail,
      profileImage,
      isActivated: isAdmin,
    },
  });
}
