import Link from "next/link";
import { Camera, Mail, Heart, X, Store, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      {/* Pre-Footer CTA */}
      <div className="border-b border-slate-100 bg-emerald-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Own a local business?</h3>
            <p className="text-slate-600 font-medium">Join hundreds of sellers growing their revenue on LocalSoko.</p>
          </div>
          <Link href="/auth/login" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-slate-900/10 active:scale-95">
            Open Your Free Store <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">

          {/* Brand & Description */}
          <div className="col-span-1 md:col-span-5">
            <Link href="/" className="flex items-center gap-2 text-2xl font-black text-slate-900 tracking-tight mb-6">
              <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
                <Store className="h-5 w-5" />
              </div>
              Local<span className="text-emerald-600">Soko</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm font-medium mb-6">
              Your trusted neighborhood marketplace. We connect local buyers with verified neighborhood sellers for a seamless, secure shopping experience.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <Zap className="h-4 w-4 text-amber-500" /> Fast Local Delivery
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden md:block col-span-2"></div>

          {/* Quick Links */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Marketplace</h3>
            <ul className="space-y-4 text-sm font-medium text-slate-500">
              <li><Link href="/" className="hover:text-emerald-600 transition-colors">Browse Stores</Link></li>
              <li><Link href="/categories" className="hover:text-emerald-600 transition-colors">All Categories</Link></li>
              <li><Link href="/auth/login" className="hover:text-emerald-600 transition-colors">Become a Seller</Link></li>
              <li><Link href="/about" className="hover:text-emerald-600 transition-colors">Our Story</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-1 md:col-span-3">
            <h3 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Support & Connect</h3>
            <a href="mailto:hello@localsoko.com" className="flex items-center gap-3 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors mb-6 bg-slate-50 w-fit px-4 py-2 rounded-xl border border-slate-100">
              <Mail className="h-4 w-4 text-emerald-600" />
              hello@localsoko.com
            </a>
            <div className="flex gap-3">
              <a href="#" className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors"><X className="h-5 w-5" /></a>
              <a href="#" className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors"><Camera className="h-5 w-5" /></a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="border-t border-slate-200/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-400">
            © {new Date().getFullYear()} LocalSoko Technologies. All rights reserved.
          </p>
          <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full">
            Built with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> in Kenya
          </p>
        </div>
      </div>
    </footer>
  );
}