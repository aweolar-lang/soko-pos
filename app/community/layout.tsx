import Link from "next/link";
import { Megaphone, Plus, Store } from "lucide-react";

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* COMMUNITY NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo / Hub Link */}
          <Link href="/community" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
              <Megaphone className="w-4 h-4" />
            </div>
            <span className="font-black text-slate-900 tracking-tight text-lg">
              Hub
            </span>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/"
              className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Store className="w-4 h-4" /> Back to Market
            </Link>
            
            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

            <Link 
              href="/community/create"
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm focus:ring-2 focus:ring-slate-400 focus:outline-none active:scale-95"
            >
              <Plus className="w-4 h-4" /> 
              <span className="hidden sm:inline">Create Post</span>
              <span className="sm:hidden">Post</span>
            </Link>
          </div>
          
        </div>
      </header>

      {/* PAGE CONTENT */}
      {/* The individual pages (page.tsx, create/page.tsx) will be injected right here */}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}