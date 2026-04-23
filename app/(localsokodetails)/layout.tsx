import Link from "next/link";
import { Store } from "lucide-react";

export default function LocalSokoDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. STICKY HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2 text-emerald-600 font-black text-xl tracking-tight transition-transform active:scale-95">
            <Store className="h-6 w-6" />
            <span>LocalSoko</span>
          </Link>

          {/* Quick links for desktop */}
          <nav className="hidden sm:flex items-center gap-6 text-sm font-bold text-slate-500">
            <Link href="/about" className="hover:text-emerald-600 transition-colors">About</Link>
            <Link href="/safety" className="hover:text-emerald-600 transition-colors">Safety</Link>
            <Link href="/contact" className="hover:text-emerald-600 transition-colors">Contact</Link>
          </nav>

        </div>
      </header>

      {/* 2. MAIN CONTENT WRAPPER */}
      {/* max-w-3xl prevents long lines of text from becoming hard to read */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm border border-slate-200">
          {children}
        </div>
      </main>
      
    </div>
  );
}