"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; 
import { Store, Mail, Lock, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail } from "@/lib/validators"; // Assuming you have this from earlier

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // NEW: Error state for real-time validation feedback
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  // Clear errors when the user starts typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate on blur (when user clicks out of the input)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return; 

    if (name === "email" && !isValidEmail(value)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
    }

    // Supabase default minimum password length is 6. 
    // This prevents API calls if they accidentally typed 2 characters.
    if (name === "password" && value.length < 6) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters." }));
    }
  };

  // Ensure form is valid before enabling the submit button
  const isFormValid = 
    formData.email.trim() !== "" && 
    formData.password.length >= 6 &&
    !Object.values(errors).some(error => error !== "");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final safety check just in case
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
      router.refresh(); // Ensure the layout grabs the new auth state

    } catch (error: any) {
      // Handle generic auth errors beautifully
      toast.error(error.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

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
                  onChange={handleInputChange} 
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${
                    errors.email 
                      ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900' 
                      : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'
                  }`} 
                  placeholder="you@localsoko.com" 
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
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
                  onChange={handleInputChange}
                  onBlur={handleBlur} 
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${
                    errors.password 
                      ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900' 
                      : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'
                  }`}  
                  placeholder="••••••••" 
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
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