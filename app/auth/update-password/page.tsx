"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Store, Lock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Verify that the user actually arrived here via a valid Supabase session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Invalid or expired reset link. Please request a new one.");
        router.push("/auth/forgot-password");
      } else {
        setIsVerifying(false);
      }
    };
    
    checkSession();
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      router.push("/dashboard"); // Take them straight to work
      router.refresh();

    } catch (error: any) {
      toast.error(error.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = 
    formData.password.length >= 6 && 
    formData.password === formData.confirmPassword;

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-slate-500 font-medium">Verifying secure link...</p>
      </div>
    );
  }

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
          Set new password
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Please enter your new password below.
        </p>
      </div>

      {/* Form Section */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleUpdatePassword}>
            
            {/* New Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                <input 
                  id="password"
                  type="password" 
                  required 
                  minLength={6}
                  autoComplete="new-password"
                  value={formData.password} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-900 bg-slate-50 focus:bg-white" 
                  placeholder="At least 6 characters" 
                />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                <input 
                  id="confirmPassword"
                  type="password" 
                  required 
                  minLength={6}
                  autoComplete="new-password"
                  value={formData.confirmPassword} 
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} 
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm text-slate-900 bg-slate-50 focus:bg-white
                    ${formData.confirmPassword && formData.password !== formData.confirmPassword 
                      ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                      : "border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    }`} 
                  placeholder="Type password again" 
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-2 text-xs text-red-500 font-medium">Passwords do not match</p>
              )}
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save Password</span>
                  <Save className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}