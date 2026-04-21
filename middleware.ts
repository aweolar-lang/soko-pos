import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a simple Supabase client for the edge
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Get the current path (e.g., '/dashboard/inventory')
  const path = req.nextUrl.pathname;

  // We only want to protect routes that start with /dashboard
  if (path.startsWith('/dashboard')) {
    // Check if the user has a valid Supabase auth cookie
    const authCookie = req.cookies.get('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].replace('https://', '') + '-auth-token');
    
    // If there is no cookie, kick them straight to the login page
    if (!authCookie) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
  }

  return res;
}

// Tell Next.js which paths this middleware should run on
export const config = {
  matcher: ['/dashboard/:path*'],
};