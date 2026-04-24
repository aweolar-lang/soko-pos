import { useState } from "react";
import { formatKenyanPhone, isValidEmail, isValidName } from "@/lib/validators";

export default function CustomerForm() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({ name: "", email: "", phone: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Update data state
    setFormData({ ...formData, [name]: value });

    // Clear specific error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return; // Skip validation if empty (unless it's required)

    // Validate on Blur (when user clicks out of the input)
    if (name === "name" && !isValidName(value)) {
      setErrors(prev => ({ ...prev, name: "Please enter a valid name (letters only)." }));
    }
    if (name === "email" && !isValidEmail(value)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address." }));
    }
    if (name === "phone") {
      const formatted = formatKenyanPhone(value);
      if (!formatted) {
        setErrors(prev => ({ ...prev, phone: "Invalid Kenyan phone number." }));
      } else {
        // Automatically format it beautifully for the user
        setFormData(prev => ({ ...prev, phone: formatted }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final check before sending to database/API
    const validPhone = formatKenyanPhone(formData.phone);
    if (!isValidName(formData.name) || !isValidEmail(formData.email) || !validPhone) {
      alert("Please fix the errors before submitting.");
      return;
    }

    // Now it's perfectly safe to send to Supabase/Paystack!
    const cleanDataToSubmit = {
      ...formData,
      phone: validPhone // Always send the sanitized 254... format to APIs
    };
    
    console.log("Submitting safe data:", cleanDataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {/* NAME INPUT */}
      <div>
        <label className="block text-sm font-bold text-slate-700">Full Name</label>
        <input 
          type="text" name="name" 
          value={formData.name} onChange={handleChange} onBlur={handleBlur}
          className={`w-full p-3 border rounded-xl outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-emerald-500'}`}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* PHONE INPUT */}
      <div>
        <label className="block text-sm font-bold text-slate-700">Phone Number</label>
        <input 
          type="tel" name="phone" 
          value={formData.phone} onChange={handleChange} onBlur={handleBlur}
          placeholder="07XX XXX XXX"
          className={`w-full p-3 border rounded-xl outline-none focus:ring-2 ${errors.phone ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-emerald-500'}`}
        />
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>

      {/* EMAIL INPUT */}
      <div>
        <label className="block text-sm font-bold text-slate-700">Email Address</label>
        <input 
          type="email" name="email" 
          value={formData.email} onChange={handleChange} onBlur={handleBlur}
          className={`w-full p-3 border rounded-xl outline-none focus:ring-2 ${errors.email ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-emerald-500'}`}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <button type="submit" className="bg-slate-900 text-white font-bold p-3 rounded-xl w-full">
        Save Details
      </button>
    </form>
  );
}