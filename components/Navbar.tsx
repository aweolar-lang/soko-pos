"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js"; 
import { Store, LayoutDashboard, LogOut, ArrowRight } from "lucide-react";

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
      try { subscription.unsubscribe(); } catch (e) { /* noop */ }
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 w-full bg-white border-b border-slate-200 z-50 transition-all" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-slate-900 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
            <Store className="h-5 w-5" />
            Soko Commerce
          </Link>
        </div>

        {/* Right: Auth & Navigation */}
        <div className="flex items-center">
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:flex items-center gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="h-4 w-px bg-slate-200 hidden sm:block mx-2"></div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link 
                href="/auth/login" 
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/login" 
                className="bg-slate-900 hover:bg-black text-white px-5 py-2 text-sm font-medium transition-colors flex items-center gap-2 border border-transparent hover:border-slate-800"
              >
                Start Selling <ArrowRight className="h-4 w-4 hidden sm:block" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}