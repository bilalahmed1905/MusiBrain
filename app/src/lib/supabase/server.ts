import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value, ...(options as any) });
        } catch {
          // Can fail if called from a Server Component; safe to ignore
        }
      },
      remove(name: string, options?: Record<string, unknown>) {
        try {
          cookieStore.set({ name, value: '', ...(options as any), maxAge: 0 });
        } catch {
          // Can fail if called from a Server Component; safe to ignore
        }
      },
    },
  });
}
