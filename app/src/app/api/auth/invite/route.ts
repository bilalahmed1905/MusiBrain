import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { user } = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const enteredCode = (body.code || '').trim().toUpperCase();

    if (!enteredCode) {
      return NextResponse.json({ error: 'Please enter an invite code' }, { status: 400 });
    }

    // Supported environment variables: INVITE_CODE="BILAL2025" or INVITE_CODES="CODE1,CODE2,CODE3"
    const allowedCodes: string[] = [];
    if (process.env.INVITE_CODE) {
      allowedCodes.push(process.env.INVITE_CODE.trim().toUpperCase());
    }
    if (process.env.INVITE_CODES) {
      process.env.INVITE_CODES.split(',').forEach(c => {
        const trimmed = c.trim().toUpperCase();
        if (trimmed) allowedCodes.push(trimmed);
      });
    }

    // If no invite code is configured, allow anyone
    if (allowedCodes.length === 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isActivated: true },
      });
      return NextResponse.json({ success: true });
    }

    const isValid = allowedCodes.includes(enteredCode);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid invite code. Please request an invite code for access.' },
        { status: 403 }
      );
    }

    // Activate the user in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { isActivated: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Invite verification error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
