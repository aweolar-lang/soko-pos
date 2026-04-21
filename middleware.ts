import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Upgraded: Initialize the official Supabase SSR client for secure cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Get the current path (e.g., '/dashboard/inventory')
  const path = request.nextUrl.pathname;

  // We only want to protect routes that start with /dashboard
  if (path.startsWith('/dashboard')) {
    // Upgraded: Securely check the session using the SSR client instead of raw cookie strings
    const { data: { session } } = await supabase.auth.getSession();

    // 1. If there is no session, kick them straight to the login page
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // 2. The SaaS Lockout Mechanism (Only for authenticated users in the dashboard)
    // We MUST exclude the billing page (so they can pay) and settings page (so new users can actually create their store first!)
    if (path !== '/dashboard/billing' && path !== '/dashboard/settings') {
      
      // Fetch their store's trial and subscription status
      const { data: store } = await supabase
        .from('stores')
        .select('trial_ends_at, subscription_ends_at')
        .eq('user_id', session.user.id)
        .single();

      if (store) {
        const now = new Date();
        const trialEnds = new Date(store.trial_ends_at);
        const subEnds = store.subscription_ends_at ? new Date(store.subscription_ends_at) : null;

        const isTrialExpired = now > trialEnds;
        const isSubExpired = !subEnds || now > subEnds;

        // If both trial and subscription are expired, lock them out!
        if (isTrialExpired && isSubExpired) {
          return NextResponse.redirect(new URL('/dashboard/billing', request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};