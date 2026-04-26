import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/' // Default redirect

 if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )
    
    // 1. Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    // ADD THIS: Catch the error so it doesn't fail silently!
    if (error) {
      console.error("Backend Auth Error:", error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    // 2. Fetch the newly logged-in user's details
    const { data: { user } } = await supabase.auth.getUser()

    // 3. THE ADMIN CHECK
    if (user?.email === "aweolar@gmail.com") {
      return NextResponse.redirect(`${origin}/admin/dashboard`) 
    }
  }

  // If it's NOT you (or there was no code), go to the default destination (merchant dashboard)
  return NextResponse.redirect(`${origin}${next}`)
}