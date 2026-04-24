"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js"; 
import { Store, LayoutDashboard, LogOut, LogIn, ChevronRight } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      try { subscription.unsubscribe(); } catch (e) {}
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      {/* Promotional Top Bar - Smart truncation on mobile */}
      <div className="bg-slate-900 text-white px-4 py-2.5 sm:py-2 text-[10px] sm:text-xs font-medium flex items-center justify-center gap-2 relative z-50 print:hidden">
        <span className="bg-emerald-500 text-white text-[9px] sm:text-[10px] uppercase font-black px-2 py-0.5 rounded-full shrink-0 tracking-wider">
          New
        </span>
        <span className="truncate sm:whitespace-normal">
          Open your neighborhood store for free today!
        </span>
        <Link href="/auth/login" className="font-bold hover:text-emerald-400 flex items-center gap-0.5 transition-colors shrink-0">
          Sign up <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Main Navbar - Sticky with Frosted Glass */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 supports-[backdrop-filter]:bg-white/60 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-black text-slate-900 tracking-tight transition-transform active:scale-95 shrink-0">
              <div className="bg-emerald-600 text-white p-1.5 sm:p-2 rounded-lg shadow-sm shadow-emerald-600/20">
                <Store className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="hidden sm:block">Local<span className="text-emerald-600">Soko</span></span>
              {/* FIXED TYPO: "LokoSoko" to "LocalSoko" */}
              <span className="block sm:hidden">LocalSoko</span>
            </Link>

            {/* Auth State Actions */}
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-emerald-600 hover:bg-white rounded-xl transition-all shadow-sm"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-slate-900 px-5 sm:px-6 py-2.5 sm:py-3 font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98]"
                >
                  <LogIn className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  <span className="text-xs sm:text-sm">Start Selling</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </header>
    </>
  );
}