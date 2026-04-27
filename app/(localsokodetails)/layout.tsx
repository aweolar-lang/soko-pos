import Link from "next/link";
import { Store } from "lucide-react";

export default function LocalSokoDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. UPGRADED STICKY HEADER (Frosted Glass) */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-2 text-emerald-600 font-black text-xl tracking-tight transition-transform active:scale-95">
            <Store className="h-6 w-6" />
            <span>LocalSoko</span>
          </Link>

          {/* Quick links for desktop */}
          <nav className="hidden sm:flex items-center gap-6 text-sm font-bold text-slate-500">
            <a 
              href="/acceptable-use" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
            Acceptable Use Policy
            </a>
            <a 
              href="/shipping" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
            Shipping Policy
            </a>
             <a 
              href="/returns" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
            Returns Policy
            </a>
             
            <Link href="/about" className="hover:text-emerald-600 transition-colors">About</Link>
            <Link href="/safety" className="hover:text-emerald-600 transition-colors">Safety</Link>
            <Link href="/contact" className="hover:text-emerald-600 transition-colors">Contact</Link>
          </nav>

        </div>
      </header>

      {/* 2. UPGRADED MAIN CONTENT WRAPPER */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* 3. OPTIONAL: Global Minimal Footer */}
      <footer className="w-full border-t border-slate-200/60 bg-white py-8 text-center">
        <p className="text-sm font-bold text-slate-400">
          © {new Date().getFullYear()} LocalSoko. All rights reserved.
        </p>
        <div className="flex justify-center gap-4 mt-3 text-xs font-medium text-slate-400">
          <Link href="/terms" className="hover:text-emerald-600">Terms</Link>
          <Link href="/privacy" className="hover:text-emerald-600">Privacy Policy</Link>
        </div>
      </footer>
      
    </div>
  );
}