import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  // Create an unmodified response by default
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Initialize the official Supabase SSR client for secure Edge cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;

  // PERFORMANCE OPTIMIZATION: 
  // Only ask Supabase for the user if they are on a protected route or the login page.
  // This keeps your homepage and public store links blazing fast.
  if (path.startsWith('/dashboard') || path === '/login') {
    
    // Securely check the session
    const { data: { user } } = await supabase.auth.getUser();

    // --- 1. DASHBOARD LOGIC ---
    if (path.startsWith('/dashboard')) {
      
      // A. If there is no session, bounce them to the login page
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login'; // Change this if your sign-in page is just '/'
        return NextResponse.redirect(url);
      }

      // B. The SaaS Lockout Mechanism
      // Exclude billing (so they can pay) and settings (so they can create a store/profile)
      if (path !== '/dashboard/billing' && path !== '/dashboard/settings') {
        
        const { data: store } = await supabase
          .from('stores')
          .select('trial_ends_at, subscription_ends_at')
          .eq('owner_id', user.id)
          .single();

        if (store) {
          const now = new Date();
          const trialEnds = new Date(store.trial_ends_at);
          const subEnds = store.subscription_ends_at ? new Date(store.subscription_ends_at) : null;

          const isTrialExpired = now > trialEnds;
          const isSubExpired = !subEnds || now > subEnds;

          // If both trial and subscription are expired, lock them out!
          if (isTrialExpired && isSubExpired) {
            const url = request.nextUrl.clone();
            url.pathname = '/dashboard/billing';
            return NextResponse.redirect(url);
          }
        }
      }
    }

    // --- 2. LOGIN PAGE LOGIC ---
    // If they ARE logged in, but try to visit the login page, bounce them to the dashboard
    if (path === '/login' && user) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

// Ensure the proxy strictly guards the exact /dashboard route, all its sub-routes, and the /login route
export const config = {
  matcher: [
    '/dashboard', 
    '/dashboard/:path*', 
    '/login'
  ],
};