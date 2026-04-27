"use client";

import Link from "next/link";
import { Store, SearchX, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-center font-sans">
      
      {/* Icon Wrapper with a subtle pulse animation */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20" />
        <div className="relative bg-white p-6 rounded-full shadow-xl shadow-slate-200/50 border border-slate-100">
          <SearchX className="w-16 h-16 text-slate-400" strokeWidth={1.5} />
        </div>
      </div>

      {/* Main Text Content */}
      <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
        Oops! Page Not Found
      </h1>
      <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm sm:text-base leading-relaxed">
        We couldn't find the page or store you're looking for. It might have been moved, deleted, or perhaps the internet bots ate it!
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm mx-auto">
        <Link 
          href="/" 
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-slate-900/10 outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <Home className="w-4 h-4" /> Go to Homepage
        </Link>
        
        <button 
          onClick={() => window.history.back()} 
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl border border-slate-200 transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>

      {/* Subtle Branding */}
      <div className="mt-16 text-slate-400 flex items-center gap-2 text-sm font-bold tracking-tight">
        <Store className="w-4 h-4" /> Local<span className="text-slate-300 font-normal">Soko</span>
      </div>
      
    </div>
  );
}