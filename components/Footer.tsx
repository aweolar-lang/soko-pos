import Link from "next/link";
import { Store, Camera, X, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-lg tracking-tight">
            <Store className="h-5 w-5" />
            Soko Commerce
          </div>
          <p className="text-sm text-slate-500 font-medium max-w-xs">
            Engineered for modern retail. Local inventory, globally accessible.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Platform</span>
            <Link href="/about" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">About Us</Link>
            <Link href="/merchants" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">For Merchants</Link>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Connect</span>
            <div className="flex items-center gap-4 text-slate-400">
              <a href="#" className="hover:text-slate-900 transition-colors"><X className="h-4 w-4" /></a>
              <a href="#" className="hover:text-slate-900 transition-colors"><Camera className="h-4 w-4" /></a>
              <a href="mailto:hello@localsoko.com" className="hover:text-slate-900 transition-colors"><Mail className="h-4 w-4" /></a>
            </div>
          </div>
        </div>

      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-slate-400 font-medium">
          © {new Date().getFullYear()} Soko Inc. All rights reserved.
        </p>
        <div className="flex gap-4 text-sm text-slate-400 font-medium">
          <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}