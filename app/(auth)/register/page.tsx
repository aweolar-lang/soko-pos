"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Store, Mail, Lock, User, Phone, Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail, isValidName, formatKenyanPhone } from "@/lib/validators";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // NEW: Toggle password visibility
  
  // 1. Data State
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });

  // 2. Error State
  const [errors, setErrors] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });

  // 3. Handle Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // 4. Handle Blur (Validation)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return; 

    if ((name === "firstName" || name === "lastName" || name === "middleName") && !isValidName(value)) {
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
        setFormData((prev) => ({ ...prev, phone: formattedPhone }));
      }
    }

    if (name === "password" && value.length < 6) {
      setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters." }));
    }
  };

  // Ensure form is valid
  const isFormValid = 
    formData.firstName.trim() !== "" && 
    formData.lastName.trim() !== "" && 
    formData.phone.trim() !== "" && 
    formData.email.trim() !== "" && 
    formData.password.length >= 6 &&
    !Object.values(errors).some(error => error !== "");
    

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalPhone = formatKenyanPhone(formData.phone);
    if (!finalPhone || !isValidEmail(formData.email) || !isValidName(formData.firstName)) {
      toast.error("Please fix the highlighted errors before continuing.");
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            middle_name: formData.middleName,
            last_name: formData.lastName,
            phone_number: finalPhone,
          }
        }
      });

      if (authError) throw authError;

      // ==========================================
      // UX UPGRADE: User Enumeration Protection
      // ==========================================
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        toast.error("This email is already registered. Please log in.");
        setIsLoading(false);
        return; 
      }

      toast.success("Account created! Please check your email to verify.");
      router.push("/verify-email");

    } catch (error: any) {
      console.error("Registration Error:", error);
      toast.error(error.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-5">
      <div className="text-center mb-8">
        <Store className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
        <h1 className="text-2xl font-black text-slate-900">Create Account</h1>
        <p className="text-slate-500 mt-2 text-sm">Join LocalSoko and start selling today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">First Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input 
              type="text" name="firstName" required disabled={isLoading}
              value={formData.firstName} onChange={handleChange} onBlur={handleBlur}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-slate-900 text-sm disabled:bg-slate-50 disabled:text-slate-500 ${errors.firstName ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
            />
          </div>
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Middle Name <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input 
              type="text" name="middleName" disabled={isLoading}
              value={formData.middleName} onChange={handleChange} onBlur={handleBlur}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-slate-900 text-sm disabled:bg-slate-50 disabled:text-slate-500 ${errors.middleName ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
            />
          </div>
          {errors.middleName && <p className="text-red-500 text-xs mt-1">{errors.middleName}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Last Name</label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input 
            type="text" name="lastName" required disabled={isLoading}
            value={formData.lastName} onChange={handleChange} onBlur={handleBlur}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-slate-900 text-sm disabled:bg-slate-50 disabled:text-slate-500 ${errors.lastName ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
          />
        </div>
        {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input 
            type="tel" name="phone" required disabled={isLoading}
            value={formData.phone} onChange={handleChange} onBlur={handleBlur}
            placeholder="07XX XXX XXX"
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-slate-900 text-sm disabled:bg-slate-50 disabled:text-slate-500 ${errors.phone ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
          />
        </div>
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input 
            type="email" name="email" required disabled={isLoading}
            value={formData.email} onChange={handleChange} onBlur={handleBlur}
            placeholder="you@example.com"
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none transition-all text-slate-900 text-sm disabled:bg-slate-50 disabled:text-slate-500 ${errors.email ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
          />
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      {/* UX UPGRADE: Password Toggle Visibility */}
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <input 
            type={showPassword ? "text" : "password"} 
            name="password" required disabled={isLoading}
            value={formData.password} onChange={handleChange} onBlur={handleBlur}
            placeholder="Minimum 6 characters"
            className={`w-full pl-10 pr-12 py-2.5 border rounded-xl outline-none transition-all text-slate-900 text-sm disabled:bg-slate-50 disabled:text-slate-500 ${errors.password ? 'border-red-500 bg-red-50 focus:ring-red-500' : 'border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500'}`} 
          />
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
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>

      <button 
        type="submit" 
        disabled={isLoading || !isFormValid} 
        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 active:scale-[0.98]"
      >
        {isLoading ? (
          <><Loader2 className="h-5 w-5 animate-spin" /><span>Creating Account...</span></>
        ) : (
          <><span>Create Account</span><UserPlus className="h-4 w-4" /></>
        )}
      </button>
      
      <p className="text-center text-sm text-slate-600 mt-4 border-t border-slate-100 pt-5">
        Already have an account? <Link href="/login" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">Log in</Link>
      </p>
    </form>
  );
}