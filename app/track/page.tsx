"use client";

import { useState, useTransition } from "react";
import { loginBuyer } from "./actions";
import { useRouter } from "next/navigation";
import { PackageSearch, Lock, Mail, Loader2, Eye, EyeOff, ArrowRight, X, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function TrackLoginPage() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  
  // States for our custom "Not Found" Modal
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [attemptedEmail, setAttemptedEmail] = useState("");
  
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emailInput = formData.get("email") as string;
    
    setAttemptedEmail(emailInput);

    startTransition(async () => {
      const result = await loginBuyer(formData);

      if (result?.error) {
        // Check if the error is specifically because the user doesn't exist
        // (Matching the string returned from our actions.ts)
        if (result.error.toLowerCase().includes("find") || result.error.toLowerCase().includes("found")) {
          setShowNotFoundModal(true);
        } else {
          // For wrong passwords or other errors, use the standard toast
          toast.error("Login Failed", {
            description: result.error,
          });
        }
      } else if (result?.success) {
        toast.success("Identity verified! Welcome back.");
        if (result.requiresChange) {
          router.push("/track/setup-password");
        } else {
          router.push("/buyer/dashboard");
        }
      }
    });
  }

  return (
    /* Full screen blurred background to create the "Popup" vibe */
    <div className="min-h-screen bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 fixed inset-0 z-40 overflow-y-auto">
      
      {/* ------------------------------------------------------------------ */}
      {/* 1. THE MAIN LOGIN MODAL */}
      {/* ------------------------------------------------------------------ */}
      <div className={`w-full max-w-md bg-white rounded-[2rem] shadow-2xl relative transition-all duration-300 ${showNotFoundModal ? 'scale-95 opacity-50 pointer-events-none' : 'scale-100 opacity-100 animate-in fade-in zoom-in-95'}`}>
        
        {/* Close Button to return Home */}
        <Link href="/" className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10">
          <X className="w-5 h-5" />
        </Link>

        {/* Header Section */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-3xl mb-5 rotate-3 shadow-inner">
            <PackageSearch className="text-emerald-600 h-10 w-10 -rotate-3" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Track Your Order</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Log in to view your purchases and downloads.</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input 
                name="email"
                type="email" 
                required
                placeholder="name@email.com"
                className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <button type="button" className="text-xs text-emerald-600 font-bold hover:underline">Forgot?</button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input 
                name="password"
                type={showPassword ? "text" : "password"} 
                required
                placeholder="••••••••"
                className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex gap-3 items-start mt-2">
            <span className="text-emerald-500 text-lg leading-none">💡</span>
            <p className="text-[12px] sm:text-[13px] text-emerald-700 leading-snug font-medium">
              <strong className="block mb-0.5">First time logging in?</strong> 
              Your password is the first 6 characters of your email.
            </p>
          </div>

          <button 
            disabled={isPending}
            className="group relative w-full mt-6 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center overflow-hidden active:scale-[0.98]"
          >
            <span className={`flex items-center gap-2 transition-transform ${isPending ? 'opacity-0' : 'group-hover:-translate-x-1'}`}>
              Access Dashboard <ArrowRight className="h-5 w-5" />
            </span>
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </button>
        </form>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 2. THE "USER NOT FOUND" INFO MODAL */}
      {/* ------------------------------------------------------------------ */}
      {showNotFoundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative animate-in zoom-in-95 duration-200">
            
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3 border border-blue-100">
              <ShoppingBag className="w-8 h-8 -rotate-3" />
            </div>
            
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">No Account Found</h3>
            
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              We couldn't find an account for <strong className="text-slate-800">{attemptedEmail}</strong>. <br/><br/>
              Buyer accounts are completely hidden and are only created <span className="font-bold text-slate-700">after</span> you make your first purchase.
            </p>
            
            <div className="space-y-3">
              <Link href="/" className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]">
                Go Buy Something
              </Link>
              <button 
                onClick={() => setShowNotFoundModal(false)} 
                className="w-full text-slate-500 hover:text-slate-700 font-bold py-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all active:scale-[0.98]"
              >
                Try Another Email
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}