"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Store, Mail, Lock, User, Phone, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });

  // Basic validation check to disable the submit button
  const isFormValid = 
    formData.firstName.trim() !== "" && 
    formData.lastName.trim() !== "" && 
    formData.phone.trim() !== "" && 
    formData.email.trim() !== "" && 
    formData.password.length >= 6;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Create the Auth User securely
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Save the structured profile data to the database
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          first_name: formData.firstName.trim(),
          middle_name: formData.middleName.trim() || null, // Optional
          last_name: formData.lastName.trim(),
          phone_number: formData.phone.trim(),
        });

        if (profileError) throw profileError;
      }

      toast.success("Account created! Let's set up your store.");
      router.push("/dashboard/settings"); 
      router.refresh();
      
    } catch (error: any) {
      toast.error(error.message || "Failed to create account. Please try again.");
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
          Create your account
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Join SokoPOS and start selling today.
        </p>
      </div>

      {/* Form Section */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleRegister}>
            
            {/* The Three Names (Responsive Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-1">
                <label htmlFor="firstName" className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input 
                    id="firstName" type="text" required autoComplete="given-name"
                    value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white" 
                    placeholder="John" 
                  />
                </div>
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="middleName" className="block text-sm font-bold text-slate-700 mb-2">Middle Name</label>
                <input 
                  id="middleName" type="text" autoComplete="additional-name"
                  value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white" 
                  placeholder="Kamau (Optional)" 
                />
              </div>
              <div className="sm:col-span-1">
                <label htmlFor="lastName" className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                <input 
                  id="lastName" type="text" required autoComplete="family-name"
                  value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white" 
                  placeholder="Doe" 
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                <input 
                  id="phone" type="tel" required autoComplete="tel"
                  value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white" 
                  placeholder="0712345678" 
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                <input 
                  id="email" type="email" required autoComplete="email"
                  value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white" 
                  placeholder="you@localsoko.com" 
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                <input 
                  id="password" type="password" required minLength={6} autoComplete="new-password"
                  value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm bg-slate-50 focus:bg-white" 
                  placeholder="At least 6 characters" 
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading || !isFormValid} 
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <UserPlus className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link 
              href="/auth/login" 
              className="font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}