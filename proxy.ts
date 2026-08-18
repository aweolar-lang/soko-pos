import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * ============================================================
 * SAFARICOM M-PESA IP SECURITY
 * ============================================================
 *
 * These are the explicitly known Safaricom callback IPs.
 */
const SAFARICOM_IP_WHITELIST = new Set([
  '196.201.214.200',
  '196.201.214.206',
  '196.201.213.114',
  '196.201.214.207',
  '196.201.214.208',
  '196.201.213.44',
  '196.201.212.127',
  '196.201.212.138',
  '196.201.212.129',
  '196.201.212.136',
  '196.201.212.74',
  '196.201.212.69',
]);

/**
 * Safaricom primary callback subnet ranges:
 *
 * 196.201.212.0/24
 * 196.201.213.0/24
 * 196.201.214.0/24
 */
function isSafaricomSubnet(ip: string): boolean {
  const parts = ip.split('.').map(Number);

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b, c] = parts;

  return (
    a === 196 &&
    b === 201 &&
    (c === 212 || c === 213 || c === 214)
  );
}

/**
 * Get the best available client IP.
 *
 * In production this commonly comes from the reverse proxy/CDN.
 */
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (forwardedFor) {
    // Standard format:
    // client, proxy1, proxy2
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');

  if (realIp) {
    return realIp.trim();
  }

  // NextRequest may expose an IP depending on the deployment platform.
  const requestWithIp = request as NextRequest & {
    ip?: string;
  };

  return requestWithIp.ip?.trim() ?? '';
}

/**
 * ============================================================
 * MAIN PROXY
 * ============================================================
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * ==========================================================
   * 1. M-PESA WEBHOOK SECURITY
   * ==========================================================
   *
   * IMPORTANT:
   * This happens BEFORE any Supabase authentication logic.
   *
   * M-Pesa callbacks are server-to-server requests and should
   * not be redirected to /login or subjected to dashboard auth.
   */
  if (pathname.startsWith('/api/webhooks/mpesa')) {
    const clientIp = getClientIp(request);

    const isDevelopment = process.env.NODE_ENV !== 'production';

    /**
     * Allow localhost during development so local testing,
     * Postman and tools such as ngrok can work.
     */
    if (
      isDevelopment &&
      (clientIp === '127.0.0.1' ||
        clientIp === '::1' ||
        clientIp === '')
    ) {
      return NextResponse.next();
    }

    const isExplicitlyWhitelisted =
      SAFARICOM_IP_WHITELIST.has(clientIp);

    const isSafaricomNetwork =
      isSafaricomSubnet(clientIp);

    /**
     * Block anything that isn't coming from an accepted
     * Safaricom IP/network.
     */
    if (!isExplicitlyWhitelisted && !isSafaricomNetwork) {
      console.warn(
        `[SECURITY] Blocked unauthorized M-Pesa webhook request from IP: ${clientIp || 'unknown'}`
      );

      return NextResponse.json(
        {
          error:
            'Forbidden: IP address not authorized by Safaricom gateway.',
        },
        { status: 403 }
      );
    }

    /**
     * Authorized M-Pesa request.
     * Do NOT create a Supabase auth client here.
     */
    return NextResponse.next();
  }

  /**
   * ==========================================================
   * 2. SUPABASE RESPONSE / COOKIE HANDLING
   * ==========================================================
   *
   * This is only needed for dashboard/login routes.
   */
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(name, value, options);
            }
          );
        },
      },
    }
  );

  /**
   * ==========================================================
   * 3. SUPABASE AUTH CHECK
   * ==========================================================
   *
   * Only execute Supabase auth on routes that actually need it.
   */
  const requiresAuth =
    pathname.startsWith('/dashboard') ||
    pathname === '/login';

  if (!requiresAuth) {
    return response;
  }

  /**
   * getUser() validates the authenticated user with Supabase.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /**
   * ==========================================================
   * 4. DASHBOARD SECURITY
   * ==========================================================
   */
  if (pathname.startsWith('/dashboard')) {
    /**
     * No authenticated user -> login.
     */
    if (!user) {
      const url = request.nextUrl.clone();

      url.pathname = '/login';

      /**
       * Preserve the page they originally wanted.
       *
       * Example:
       * /dashboard/orders
       *
       * becomes:
       * /login?redirect=/dashboard/orders
       */
      url.searchParams.set(
        'redirect',
        pathname + request.nextUrl.search
      );

      return NextResponse.redirect(url);
    }

    /**
     * ========================================================
     * 5. SUBSCRIPTION / TRIAL LOCK
     * ========================================================
     *
     * Billing and settings must remain accessible even if
     * the subscription has expired.
     */
    const isBillingPage =
      pathname === '/dashboard/billing' ||
      pathname.startsWith('/dashboard/billing/');

    const isSettingsPage =
      pathname === '/dashboard/settings' ||
      pathname.startsWith('/dashboard/settings/');

    const isExemptFromSubscriptionLock =
      isBillingPage || isSettingsPage;

    if (!isExemptFromSubscriptionLock) {
      const { data: store, error: storeError } =
        await supabase
          .from('stores')
          .select(
            'trial_ends_at, subscription_ends_at'
          )
          .eq('owner_id', user.id)
          .maybeSingle();

      /**
       * If there is a database problem, don't accidentally
       * lock out a valid user here.
       *
       * The actual dashboard/API authorization should still
       * be enforced server-side.
       */
      if (storeError) {
        console.error(
          '[PROXY] Failed to load store subscription:',
          storeError.message
        );

        return response;
      }

      if (store) {
        const now = new Date();

        const trialEndsAt = store.trial_ends_at
          ? new Date(store.trial_ends_at)
          : null;

        const subscriptionEndsAt =
          store.subscription_ends_at
            ? new Date(store.subscription_ends_at)
            : null;

        /**
         * Treat a missing/invalid trial date as expired.
         */
        const isTrialExpired =
          !trialEndsAt ||
          Number.isNaN(trialEndsAt.getTime()) ||
          now > trialEndsAt;

        /**
         * No subscription end date means there is no
         * currently active paid subscription.
         */
        const isSubscriptionExpired =
          !subscriptionEndsAt ||
          Number.isNaN(subscriptionEndsAt.getTime()) ||
          now > subscriptionEndsAt;

        /**
         * Only lock when BOTH:
         *
         * - trial has expired
         * - paid subscription has expired / doesn't exist
         */
        if (
          isTrialExpired &&
          isSubscriptionExpired
        ) {
          const url = request.nextUrl.clone();

          url.pathname = '/dashboard/billing';

          /**
           * Prevent redirect loops if billing ever changes.
           */
          url.searchParams.set(
            'reason',
            'subscription_required'
          );

          return NextResponse.redirect(url);
        }
      }
    }
  }

  /**
   * ==========================================================
   * 6. LOGIN PAGE PROTECTION
   * ==========================================================
   *
   * Authenticated users shouldn't see /login.
   */
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone();

    url.pathname = '/dashboard';

    /**
     * Remove old login-specific parameters.
     */
    url.searchParams.delete('redirect');

    return NextResponse.redirect(url);
  }

  /**
   * ==========================================================
   * 7. RETURN SUPABASE-AWARE RESPONSE
   * ==========================================================
   */
  return response;
}

/**
 * ============================================================
 * PROXY MATCHER
 * ============================================================
 *
 * The proxy is only invoked for:
 *
 * - /dashboard
 * - /dashboard/*
 * - /login
 * - /api/webhooks/mpesa/*
 *
 * Public LocalSoko pages do not run this proxy.
 */
export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/login',
    '/api/webhooks/mpesa/:path*',
  ],
};
