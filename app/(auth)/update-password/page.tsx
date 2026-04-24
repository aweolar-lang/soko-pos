"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  // Verify that the user actually arrived here via a valid Supabase session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Invalid or expired reset link. Please request a new one.");
        router.push("/forgot-password"); // Ensure this matches your route structure!
      } else {
        setIsVerifying(false);
      }
    };
    
    checkSession();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "password" && errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return; 

    if (name === "password" && value.length < 6) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters." }));
    }

    if (name === "confirmPassword" && value !== formData.password) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match." }));
    }
  };

  const isFormValid = 
    formData.password.length >= 6 && 
    formData.password === formData.confirmPassword &&
    !Object.values(errors).some(error => error !== "");

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match." }));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      router.push("/dashboard"); 
      router.refresh();

    } catch (error: any) {
      toast.error(error.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // LOADING / VERIFYING STATE
  // ==========================================
  if (isVerifying) {
    return (
      <div className="bg-white p-12 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Authenticating</h2>
        <p className="text-slate-500 text-sm">Verifying your secure link...</p>
      </div>
    );
  }

  // ==========================================
  // FORM STATE
  // ==========================================
  return (
    <form onSubmit={handleUpdatePassword} className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
      
      <div className="text-center mb-8">
        <Store className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
        <h1 className="text-2xl font-black text-slate-900">Set new password</h1>
        <p className="text-slate-500 mt-2 text-sm">Please enter your new password below.</p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
          <input 
            id="password"
            name="password"
            type="password" 
            required 
            minLength={6}
            autoComplete="new-password"
            value={formData.password} 
            onChange={handleInputChange} 
            onBlur={handleBlur}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${
              errors.password 
                ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900' 
                : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'
            }`} 
            placeholder="At least 6 characters" 
          />
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
          <input 
            id="confirmPassword"
            name="confirmPassword"
            type="password" 
            required 
            minLength={6}
            autoComplete="new-password"
            value={formData.confirmPassword} 
            onChange={handleInputChange} 
            onBlur={handleBlur}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${
              errors.confirmPassword 
                ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900' 
                : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'
            }`} 
            placeholder="Type password again" 
          />
        </div>
        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirmPassword}</p>}
      </div>

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
  );
}