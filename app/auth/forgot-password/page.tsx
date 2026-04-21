"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Store, Mail, Loader2, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Send the reset email. The redirectTo URL is where the user goes AFTER clicking the email link.
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "https://localsoko.com/auth/update-password",
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

  const isFormValid = email.trim() !== "";

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
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email and we'll send you a link to get back into your account.
        </p>
      </div>

      {/* Form / Success Section */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          
          {isSubmitted ? (
            <div className="text-center space-y-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100">
                <Mail className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Check your email</h3>
                <p className="mt-2 text-sm text-slate-500">
                  We've sent a password reset link to <span className="font-semibold text-slate-900">{email}</span>. 
                  Please check your inbox and spam folder.
                </p>
              </div>
              <Link 
                href="/auth/login"
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              
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
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-900 bg-slate-50 focus:bg-white" 
                    placeholder="you@localsoko.com" 
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoading || !isFormValid} 
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
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
            </form>
          )}

          {/* Back to Login Link (Only show if not submitted) */}
          {!isSubmitted && (
            <div className="mt-8 text-center text-sm text-slate-600">
              Remember your password?{" "}
              <Link 
                href="/auth/login" 
                className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
              >
                Sign in here
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}