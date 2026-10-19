// API: Supabase-backed auth session + DB user sync
import { NextResponse } from 'next/server';
import { ensureDbUser, getServerUser } from '@/lib/auth';

// GET: Get current user from Supabase session and sync to DB
export async function GET() {
  try {
    const { user } = await getServerUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    let dbUser;
    try {
      dbUser = await ensureDbUser(user);
    } catch (dbErr: any) {
      console.error('Database user sync error in /api/auth:', dbErr?.message);
      const metadata = user.user_metadata || {};
      dbUser = {
        id: user.id,
        displayName: metadata.full_name || metadata.name || user.email || 'Music lover',
        email: user.email || null,
        profileImage: metadata.avatar_url || metadata.picture || null,
        isActivated: true,
      };
    }

    const inviteRequired = Boolean(process.env.INVITE_CODE || process.env.INVITE_CODES);
    const isOwner = dbUser.email === 'bilalahmed1905@gmail.com';
    const isActivated = !inviteRequired || isOwner || Boolean((dbUser as any).isActivated);

    return NextResponse.json({ user: dbUser, isActivated });
  } catch (error: any) {
    console.error('Auth error in /api/auth:', error);
    const message = error?.message || 'Database connection error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
