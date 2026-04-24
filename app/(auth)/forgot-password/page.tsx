"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Store, Mail, Loader2, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail } from "@/lib/validators"; 

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    if (errors.email) {
      setErrors({ email: "" });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) return; 

    if (!isValidEmail(value)) {
      setErrors({ email: "Please enter a valid email address." });
    }
  };

  const isFormValid = email.trim() !== "" && errors.email === "";

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidEmail(email)) {
      setErrors({ email: "Please enter a valid email address." });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        // NOTE: If you are testing locally, this will still redirect to your live domain.
        // You might want to change this to process.env.NEXT_PUBLIC_SITE_URL + "/update-password" later!
        redirectTo: "https://localsoko.com/update-password",
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Reset link sent successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
      
      {isSubmitted ? (
        // ==========================================
        // SUCCESS STATE (Check your email)
        // ==========================================
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 border-8 border-emerald-100/50">
            <Mail className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Check your email</h3>
            <p className="text-sm text-slate-500 leading-relaxed px-2">
              We've sent a password reset link to <br/>
              <span className="font-semibold text-slate-900">{email}</span>.<br/> 
              Please check your inbox and spam folder.
            </p>
          </div>
          <Link 
            href="/login"
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 mt-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>
      ) : (
        // ==========================================
        // FORM STATE (Enter email)
        // ==========================================
        <form className="space-y-6" onSubmit={handleResetPassword}>
          
          <div className="text-center mb-8">
            <Store className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
            <h1 className="text-2xl font-black text-slate-900">Reset password</h1>
            <p className="text-slate-500 mt-2 text-sm">Enter your email and we'll send you a secure reset link.</p>
          </div>

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
                value={email} 
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

          <button 
            type="submit" 
            disabled={isLoading || !isFormValid} 
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <Send className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="mt-8 text-center text-sm text-slate-600 border-t border-slate-100 pt-6">
            Remember your password?{" "}
            <Link 
              href="/login" 
              className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}