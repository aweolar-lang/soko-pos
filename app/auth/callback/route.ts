import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  // 1. Grab the URL the user just landed on
  const { searchParams, origin } = new URL(request.url);
  
  // 2. Extract the secret login code Supabase put in the link
  const code = searchParams.get("code");
  
  // 3. See if we told them to go somewhere specific (like /dashboard)
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    // 4. Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // 5. Exchange the secret code for a real, secure session!
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // SUCCESS! Send them directly to the dashboard
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth Callback Error:", error.message);
    }
  }

  // FAIL: If the link was expired or broken, send them back to login
  return NextResponse.redirect(`${origin}/login?error=InvalidLink`);
}