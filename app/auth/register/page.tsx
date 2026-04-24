"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Store, Mail, Lock, User, Phone, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail, isValidName, formatKenyanPhone } from "@/lib/validators";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 1. Data State
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });

  // 2. Error State (Tracks individual input errors)
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });

  // 3. Handle Change (Clears error when typing)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear the error for this specific field as soon as they start typing again
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // 4. Handle Blur (Validates when they click out of the input)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return; 

    if ((name === "firstName" || name === "lastName") && !isValidName(value)) {
      setErrors((prev) => ({ ...prev, [name]: "Please enter a valid name (letters only)." }));
    }
    
    if (name === "email" && !isValidEmail(value)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
    }
    
    if (name === "phone") {
      const formattedPhone = formatKenyanPhone(value);
      if (!formattedPhone) {
        setErrors((prev) => ({ ...prev, phone: "Invalid phone. Start with 07, 01, or 254." }));
      } else {
        // Auto-format the phone number in the UI to the clean 254... format
        setFormData((prev) => ({ ...prev, phone: formattedPhone }));
      }
    }

    if (name === "password" && value.length < 6) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters." }));
    }
  };

  // Check if form is valid enough to enable the submit button
  const isFormValid = 
    formData.firstName.trim() !== "" && 
    formData.lastName.trim() !== "" && 
    formData.phone.trim() !== "" && 
    formData.email.trim() !== "" && 
    formData.password.length >= 6 &&
    !Object.values(errors).some(error => error !== ""); // Ensures no pending errors

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final Safety Check before submission
    const finalPhone = formatKenyanPhone(formData.phone);
    if (!finalPhone || !isValidEmail(formData.email) || !isValidName(formData.firstName)) {
      toast.error("Please fix the highlighted errors before continuing.");
      return;
    }

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
          first_name: formData.firstName,
          middle_name: formData.middleName,
          last_name: formData.lastName,
          phone: finalPhone, // Save the sanitized 254... format!
          email: formData.email,
        });

        if (profileError) throw profileError;
      }

      toast.success("Account created successfully! Welcome to LocalSoko.");
      router.push("/dashboard"); 

    } catch (error: any) {
      console.error("Registration Error:", error);
      toast.error(error.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <form onSubmit={handleRegister} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
        <div className="text-center mb-8">
          <Store className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
          <h1 className="text-2xl font-black text-slate-900">Create Account</h1>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">First Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input 
                type="text" name="firstName" required
                value={formData.firstName} onChange={handleChange} onBlur={handleBlur}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${errors.firstName ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
              />
            </div>
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Last Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input 
                type="text" name="lastName" required
                value={formData.lastName} onChange={handleChange} onBlur={handleBlur}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${errors.lastName ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
              />
            </div>
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input 
              type="tel" name="phone" required
              value={formData.phone} onChange={handleChange} onBlur={handleBlur}
              placeholder="07XX XXX XXX"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${errors.phone ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input 
              type="email" name="email" required
              value={formData.email} onChange={handleChange} onBlur={handleBlur}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${errors.email ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input 
              type="password" name="password" required
              value={formData.password} onChange={handleChange} onBlur={handleBlur}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${errors.password ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
            />
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !isFormValid} 
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <><Loader2 className="h-5 w-5 animate-spin" /><span>Creating Account...</span></>
          ) : (
            <><span>Create Account</span><UserPlus className="h-4 w-4" /></>
          )}
        </button>
      </form>
    </div>
  );
}