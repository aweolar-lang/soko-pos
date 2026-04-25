"use client";

import { useState, useTransition } from "react";
import { updateBuyerPassword } from "./actions";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function SetupPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateBuyerPassword(formData);

      if (result?.error) {
        toast.error("Update Failed", { description: result.error });
      } else if (result?.success) {
        toast.success("Account Secured!", { description: "Your private password has been saved." });
        // Send them straight to their goodies!
        router.push("/buyer/dashboard");
      }
    });
  }

  return (
    /* Matches the dark blurred aesthetic of the login page */
    <div className="min-h-screen bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 fixed inset-0 z-40 overflow-y-auto">
      
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Section */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-3xl mb-5 shadow-inner">
            <ShieldCheck className="text-blue-600 h-10 w-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Secure Account</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Please replace your temporary email-based password with a private one.
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 ml-1">New Private Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                name="password"
                type={showPassword ? "text" : "password"} 
                required
                minLength={6}
                placeholder="Min. 6 characters"
                className="block w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
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

          <button 
            disabled={isPending}
            className="group relative w-full mt-6 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center overflow-hidden active:scale-[0.98]"
          >
            <span className={`flex items-center gap-2 transition-transform ${isPending ? 'opacity-0' : 'group-hover:scale-105'}`}>
              Save & Continue <CheckCircle2 className="h-5 w-5" />
            </span>
            {isPending && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}