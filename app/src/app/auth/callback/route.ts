import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const errorParam = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const origin = forwardedHost ? `https://${forwardedHost}` : requestUrl.origin;

  if (errorParam) {
    console.error('Supabase auth error param:', errorParam);
    return NextResponse.redirect(`${origin}/?auth=error&reason=${encodeURIComponent(errorParam)}`);
  }

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.redirect(`${origin}/?auth=error&reason=supabase_not_configured`);
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Supabase auth exchange error:', error);
        return NextResponse.redirect(`${origin}/?auth=error&reason=${encodeURIComponent(error.message)}`);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    } catch (err: any) {
      console.error('Supabase auth callback exception:', err);
      return NextResponse.redirect(`${origin}/?auth=error&reason=${encodeURIComponent(err?.message || 'unknown')}`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
