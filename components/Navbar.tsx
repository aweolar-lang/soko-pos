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
      {/* Promotional Top Bar - Great for localized marketing campaigns */}
      <div className="bg-slate-900 text-white px-4 py-2 text-xs sm:text-sm font-medium text-center flex items-center justify-center gap-2">
        <span className="bg-emerald-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">New</span>
        Open your neighborhood store for free today! 
        <Link href="/auth/login" className="font-bold hover:text-emerald-400 transition-colors inline-flex items-center">
          Learn more <ChevronRight className="h-3 w-3 ml-0.5" />
        </Link>
      </div>

      <nav className="bg-white/85 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 transition-all duration-300" role="navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">

            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="bg-emerald-600 text-white p-2 rounded-xl group-hover:scale-105 transition-transform shadow-sm shadow-emerald-600/20">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                Local<span className="text-emerald-600">Soko</span>
              </span>
            </Link>

            {/* Auth & Navigation */}
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center gap-1 sm:gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-600 hover:bg-white rounded-xl transition-all shadow-sm"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-slate-900 px-6 py-2.5 font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95"
                >
                  <LogIn className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  <span className="text-sm">Start Selling</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </nav>
    </>
  );
}