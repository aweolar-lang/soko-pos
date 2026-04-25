"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Store, LayoutDashboard, LogOut, LogIn, ChevronRight, Package } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // Fetch initial session
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      {/* Promotional Top Bar */}
      <div className="bg-slate-900 text-white px-4 py-2 sm:py-2.5 text-xs font-medium flex items-center justify-center gap-2 md:gap-3 relative z-50 print:hidden">
        <span className="bg-emerald-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full shrink-0 tracking-wider">
          New
        </span>
        <span className="truncate text-center max-w-[200px] sm:max-w-none">
          Open your neighborhood store for free today!
        </span>
        <Link 
          href="/login" 
          className="font-bold hover:text-emerald-400 flex items-center gap-0.5 transition-colors shrink-0 group outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm"
        >
          Sign up <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 supports-[backdrop-filter]:bg-white/60 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex h-16 sm:h-20 items-center justify-between gap-4" aria-label="Main navigation">
            
            {/* Logo */}
            <Link 
              href="/" 
              className="flex items-center gap-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight transition-transform active:scale-95 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg"
              aria-label="LocalSoko Home"
            >
              <div className="bg-emerald-600 text-white p-1.5 sm:p-2 rounded-lg shadow-sm shadow-emerald-600/20">
                <Store className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="hidden md:block">Local<span className="text-emerald-600">Soko</span></span>
            </Link>

            {/* Actions: Buyers & Sellers */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Buyer Portal */}
              <Link
                href="/track"
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-emerald-600 hover:bg-slate-50 rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden md:inline">Track Order</span>
              </Link>

              {/* Vertical Divider */}
              <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block" aria-hidden="true"></div>

              {/* Seller Auth State Container (Fixed width to prevent layout shift) */}
              <div className="min-w-[140px] flex justify-end">
                {isLoading ? (
                  /* Loading Skeleton */
                  <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-full" aria-hidden="true" />
                ) : user ? (
                  /* Logged In */
                  <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100 shadow-sm">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-600 hover:bg-white rounded-xl transition-all shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span className="hidden md:inline">Dashboard</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      aria-label="Log out"
                      title="Log out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  /* Logged Out */
                  <Link
                    href="/login"
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-slate-900 px-4 sm:px-6 py-2.5 font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                  >
                    <LogIn className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                    <span className="text-xs sm:text-sm whitespace-nowrap">Start Selling</span>
                  </Link>
                )}
              </div>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}