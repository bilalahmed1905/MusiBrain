// API: User management (simple session-based for MVP)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { randomBytes } from 'crypto';

// POST: Create or get user (simple auth for MVP)
export async function POST(request: NextRequest) {
  try {
    const { displayName, email } = await request.json();

    if (!displayName) {
      return NextResponse.json({ error: 'displayName required' }, { status: 400 });
    }

    // Find or create user
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          displayName,
          email: email || null,
        },
      });
    }

    // Create session
    const token = randomBytes(32).toString('hex');
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    const response = NextResponse.json({ user, token: session.token });
    
    // Set cookie
    response.cookies.set('musibrain_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// GET: Get current user from session
export async function GET(request: NextRequest) {
  const token = request.cookies.get('musibrain_session')?.value;
  
  if (!token) {
    return NextResponse.json({ user: null });
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: session.user });
}
