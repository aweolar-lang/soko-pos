"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Store, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // --- SIGN IN LOGIC ---
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) throw error;
        
        toast.success("Welcome back to SokoPOS!");
        router.push("/dashboard");

      } else {
        // --- SIGN UP LOGIC ---
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            // We can add custom data here if needed later
          }
        });

        if (error) throw error;

        // Auto-create a profile row for the new user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').insert({
            id: user.id,
            // default values for new sellers
          });
        }

        toast.success("Account created! Let's set up your store.");
        // Redirect brand new users straight to settings so they are forced to pick a store name
        router.push("/dashboard/settings"); 
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-200">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-emerald-600 font-black text-2xl tracking-tight mb-6">
          <Store className="h-8 w-8" />
          SokoPOS
        </Link>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          {isLogin ? "Sign in to your dashboard" : "Create your free account"}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {isLogin ? "Welcome back, seller." : "Start selling online and in-person today."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleAuth}>
            
            {/* Email Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-8 text-center text-sm text-slate-600">
            {isLogin ? "Don't have a store yet?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              {isLogin ? "Sign up for free" : "Sign in here"}
            </button>
          </div>
          
        </div>
      </div>
      
    </div>
  );
}