import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getLocalUser, LOCAL_SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getLocalUser();
    const cookieStore = await cookies();

    cookieStore.set({
      name: LOCAL_SESSION_COOKIE,
      value: 'true',
      path: '/',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error('Local login error:', err);
    return NextResponse.json({ error: 'Failed to sign in locally' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.set({
      name: LOCAL_SESSION_COOKIE,
      value: '',
      path: '/',
      maxAge: 0,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Local logout error:', err);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
