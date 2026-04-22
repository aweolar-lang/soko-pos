"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { Store, Mail, Lock, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  // Create the SSR-compatible browser client

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) throw error;
      
      toast.success("Welcome back to LocalSoko!");
      router.push("/dashboard");
      router.refresh(); // Ensure the layout grabs the new auth state

    } catch (error: any) {
      toast.error(error.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email.trim() !== "" && formData.password.trim() !== "";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-200">
      
      {/* Header Section */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4 sm:px-0">
        <Link 
          href="https://localsoko.com" 
          className="inline-flex items-center gap-2 text-emerald-600 font-black text-2xl tracking-tight mb-6 hover:opacity-80 transition-opacity"
          aria-label="Back to LocalSoko Home"
        >
          <Store className="h-8 w-8" />
          SokoPOS
        </Link>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to manage your store and inventory.
        </p>
      </div>

      {/* Form Section */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                <input 
                  id="email"
                  name="email"
                  type="email" 
                  required 
                  autoComplete="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-900 bg-slate-50 focus:bg-white" 
                  placeholder="you@localsoko.com" 
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                  Password
                </label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                <input 
                  id="password"
                  name="password"
                  type="password" 
                  required 
                  autoComplete="current-password"
                  value={formData.password} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-900 bg-slate-50 focus:bg-white" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading || !isFormValid} 
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-8 text-center text-sm text-slate-600">
            Don't have a store yet?{" "}
            <Link 
              href="/auth/register" 
              className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              Sign up for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}