import Link from "next/link";
import { Camera, Mail, Heart, X, Store, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto overflow-hidden print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 mb-12">
          
          {/* Brand & Description (Takes up more space on desktop) */}
          <div className="sm:col-span-2 lg:col-span-5">
            <Link href="/" className="flex items-center gap-2 text-2xl font-black text-slate-900 tracking-tight mb-5 w-fit">
              <div className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm shadow-emerald-600/20">
                <Store className="h-5 w-5" />
              </div>
              Local<span className="text-emerald-600">Soko</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm font-medium mb-6">
              Your trusted neighborhood marketplace. We connect local buyers with verified neighborhood sellers for a seamless, secure shopping experience.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Secure
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5 text-amber-500" /> Fast Setup
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h3 className="font-black text-slate-900 mb-5 uppercase tracking-wider text-xs">Platform</h3>
            <ul className="space-y-3 sm:space-y-4">
              <li>
                <Link href="/about" className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-2 group">
                  <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-emerald-500 transition-colors" /> About Us
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-2 group">
                  <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-emerald-500 transition-colors" /> Start Selling
                </Link>
              </li>
              <li>
                <Link href="/safety" className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-2 group">
                  <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-emerald-500 transition-colors" /> Trust & Safety
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Connect */}
          <div className="lg:col-span-4">
            <h3 className="font-black text-slate-900 mb-5 uppercase tracking-wider text-xs">Support & Connect</h3>
            <a href="mailto:hello@localsoko.com" className="flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-emerald-600 transition-colors mb-6 bg-slate-50 w-fit px-4 py-3 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 shadow-sm">
              <Mail className="h-4 w-4 text-emerald-600" />
              hello@localsoko.com
            </a>
            <div className="flex gap-3">
              <a href="#" aria-label="Twitter/X" className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-400 hover:bg-white transition-all shadow-sm active:scale-95">
                <X className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Instagram" className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50 transition-all shadow-sm active:scale-95">
                <Camera className="h-4 w-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Row */}
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <p className="text-sm font-medium text-slate-400">
            © {new Date().getFullYear()} LocalSoko Technologies. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-slate-400">
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <span className="hidden sm:inline text-slate-300">•</span>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <span className="hidden sm:inline text-slate-300">•</span>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact Support</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}