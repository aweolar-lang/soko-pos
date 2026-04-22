import { createBrowserClient } from '@supabase/ssr';

// We use the '!' at the end to tell TypeScript that we promise these environment variables exist.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Upgraded to use the SSR Browser Client so it automatically sets cookies!
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

