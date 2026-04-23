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

      {/* 3. FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-10 sm:py-12 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          
          <div className="flex items-center gap-2 text-slate-300 font-black text-lg">
            <Store className="h-5 w-5" />
            <span>LocalSoko</span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-500">
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="/safety" className="hover:text-slate-900 transition-colors">Safety Guidelines</Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact Us</Link>
          </div>

          <p className="text-sm text-slate-400 font-medium text-center md:text-right">
            © {new Date().getFullYear()} LocalSoko. <br className="block sm:hidden" /> All rights reserved.
          </p>

        </div>
      </footer>
      
    </div>
  );
}