"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { Store, Mail, Lock, Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail } from "@/lib/validators"; 

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // NEW: Toggle password visibility
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return; 

    if (name === "email" && !isValidEmail(value)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
    }

    if (name === "password" && value.length < 6) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters." }));
    }
  };

  const isFormValid = 
    formData.email.trim() !== "" && 
    formData.password.length >= 6 &&
    !Object.values(errors).some(error => error !== "");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address." }));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) throw error;
      
      toast.success("Welcome back to LocalSoko!");
      router.push("/dashboard");
      router.refresh(); 

    } catch (error: any) {
      // ============================================
      // SMART ERROR HANDLING: Catch Unverified Users
      // ============================================
      if (error.message && error.message.includes("Email not confirmed")) {
        toast.error("Please verify your email before logging in.");
        router.push("/verify-email"); // Route them to the verify page!
      } else {
        toast.error(error.message || "Invalid email or password.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
      
      <div className="text-center mb-8">
        <Store className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
        <h1 className="text-2xl font-black text-slate-900">Welcome back</h1>
        <p className="text-slate-500 mt-2 text-sm">Sign in to manage your store and inventory.</p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
          <input 
            id="email"
            name="email"
            type="email" 
            required 
            disabled={isLoading}
            autoComplete="email"
            value={formData.email} 
            onChange={handleInputChange} 
            onBlur={handleBlur}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm disabled:bg-slate-50 disabled:text-slate-500 ${
              errors.email 
                ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900' 
                : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'
            }`} 
            placeholder="you@localsoko.com" 
          />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="block text-sm font-bold text-slate-700">
            Password
          </label>
          <Link 
            href="/forgot-password" 
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
            type={showPassword ? "text" : "password"} 
            required 
            disabled={isLoading}
            autoComplete="current-password"
            value={formData.password} 
            onChange={handleInputChange}
            onBlur={handleBlur} 
            className={`w-full pl-10 pr-12 py-2.5 border rounded-xl outline-none transition-all text-sm disabled:bg-slate-50 disabled:text-slate-500 ${
              errors.password 
                ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900' 
                : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'
            }`}  
            placeholder="••••••••" 
          />
          {/* UX UPGRADE: Password Toggle Visibility */}
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
      </div>

      <button 
        type="submit" 
        disabled={isLoading || !isFormValid} 
        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
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

      <div className="mt-8 text-center text-sm text-slate-600 border-t border-slate-100 pt-6">
        Don't have a store yet?{" "}
        <Link 
          href="/register" 
          className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
        >
          Sign up for free
        </Link>
      </div>
    </form>
  );
}