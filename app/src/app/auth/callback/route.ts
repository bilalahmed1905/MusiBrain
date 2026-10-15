import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  let redirectUrl = new URL('/dashboard', request.url);

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      if (!supabase) {
        redirectUrl = new URL('/?auth=error', request.url);
      } else {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Supabase auth exchange error:', error);
          redirectUrl = new URL('/?auth=error', request.url);
        }
      }
    } catch (err) {
      console.error('Supabase auth callback error:', err);
      redirectUrl = new URL('/?auth=error', request.url);
    }
  } else {
    redirectUrl = new URL('/', request.url);
  }

  return NextResponse.redirect(redirectUrl);
}
