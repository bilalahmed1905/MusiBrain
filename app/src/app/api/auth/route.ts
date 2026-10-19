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

    const dbUser = await ensureDbUser(user);
    const inviteRequired = Boolean(process.env.INVITE_CODE || process.env.INVITE_CODES);
    const isOwner = dbUser.email === 'bilalahmed1905@gmail.com';
    const isActivated = !inviteRequired || isOwner || Boolean(dbUser.isActivated);

    return NextResponse.json({ user: dbUser, isActivated });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
