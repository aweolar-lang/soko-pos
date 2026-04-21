import { createClient } from '@supabase/supabase-js';

// We use the '!' at the end to tell TypeScript that we promise these environment variables exist.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);