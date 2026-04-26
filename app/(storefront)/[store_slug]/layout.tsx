import { ShoppingBag, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The wrapper ensures the page is ALWAYS at least the height of the screen
    <div className="relative min-h-screen flex flex-col bg-[#F8FAFC] selection:bg-emerald-500/30">
      
      {/* flex-1 forces the main content to take up all available space, pushing the footer down */}
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>
      
      {/* GLOBAL STOREFRONT FOOTER */}
      {/* mt-auto guarantees it locks to the bottom. shrink-0 prevents it from squishing */}
      <footer className="bg-white border-t border-slate-200 mt-auto shrink-0 relative z-50 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Trust Indicator - Crucial for conversions */}
          <div className="flex items-center gap-2 text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-xs sm:text-sm font-semibold">100% Secure Checkout</span>
          </div>
          
          {/* Subtle Platform Branding */}
          <Link 
            href="/" 
            className="group flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors"
            title="Create your own store on LocalSoko"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Powered by</span>
            <span className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" />
              LocalSoko
            </span>
          </Link>
          
        </div>
      </footer>

    </div>
  );
}