import prisma from '@/lib/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

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
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return { user: null, error };
  }
  return { user: data.user, error: null };
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

  const existingById = await prisma.user.findUnique({ where: { id: user.id } });
  if (existingById) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        displayName,
        ...(safeEmail ? { email: safeEmail } : {}),
        profileImage,
      },
    });
  }

  return prisma.user.create({
    data: {
      id: user.id,
      displayName,
      email: safeEmail,
      profileImage,
    },
  });
}
