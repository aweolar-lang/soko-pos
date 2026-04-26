import Link from "next/link";
import { Store, ShieldCheck } from "lucide-react";

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Buyer Specific Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shrink-0">
        <Link href="/" className="flex items-center gap-2 text-slate-900 font-black text-xl tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg">
          <div className="bg-slate-900 text-white p-1.5 rounded-lg">
            <Store className="h-4 w-4" />
          </div>
          Local<span className="text-slate-500">Soko</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <ShieldCheck className="w-4 h-4" />
          Secure Buyer Portal
        </div>
      </header>

      {/* Main Buyer Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}