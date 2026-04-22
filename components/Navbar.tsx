"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js"; 
import { Store, LayoutDashboard, LogOut, LogIn } from "lucide-react";

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
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm" role="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-black text-emerald-600 tracking-tight hover:opacity-90 transition-opacity">
            <Store className="h-6 w-6" />
            LocalSoko
          </Link>

          {/* Right: Auth & Navigation */}
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <div className="h-5 w-px bg-slate-200 hidden sm:block mx-1"></div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-md shadow-emerald-600/20"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In / Start Selling</span>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}