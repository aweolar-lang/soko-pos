import Link from "next/link";
import { Camera, Mail, Heart, X, Store } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Brand & Description */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-2xl font-black text-emerald-600 tracking-tight mb-4">
              <Store className="h-6 w-6" />
              LocalSoko
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm font-medium">
              Your trusted neighborhood marketplace. Buy and sell electronics, furniture, cars, and more with zero hassle.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">Quick Links</h3>
            <ul className="space-y-3 text-sm font-medium text-slate-500">
              <li><Link href="/" className="hover:text-emerald-600 transition-colors">Browse Stores</Link></li>
              <li><Link href="/auth/login" className="hover:text-emerald-600 transition-colors">Open a Store</Link></li>
              <li><Link href="/about" className="hover:text-emerald-600 transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 uppercase tracking-wider text-xs">Connect</h3>
            <div className="flex gap-4 mb-4">
              <a href="#" className="text-slate-400 hover:text-emerald-600 transition-colors"><X className="h-5 w-5" /></a>
              <a href="#" className="text-slate-400 hover:text-emerald-600 transition-colors"><Camera className="h-5 w-5" /></a>
            </div>
            <a href="mailto:hello@localsoko.com" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors">
              <Mail className="h-4 w-4" />
              hello@localsoko.com
            </a>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-medium text-slate-400">
            © {new Date().getFullYear()} LocalSoko Marketplace. All rights reserved.
          </p>
          <p className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
            Made with <Heart className="h-4 w-4 text-red-500 fill-red-500" /> in Kenya
          </p>
        </div>
      </div>
    </footer>
  );
}