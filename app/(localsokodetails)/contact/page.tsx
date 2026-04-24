"use client";

import { useState } from "react";
import { Mail, MapPin, Send, MessageSquare, CheckCircle, Loader2, Globe, HelpCircle, Briefcase } from "lucide-react";
import { isValidEmail, isValidName } from "@/lib/validators"; // Import validators

export default function ContactPage() {
  // 1. Unified Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  // 2. Error State
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  
  // Submission Status State
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  // Handle Input Changes & Clear Errors
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error immediately when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate on blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!value) return; 

    if ((name === "firstName" || name === "lastName") && !isValidName(value)) {
      setErrors((prev) => ({ ...prev, [name]: "Please enter a valid name (letters only)." }));
    }

    if (name === "email" && !isValidEmail(value)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
    }

    if (name === "message" && value.trim().length < 10) {
      setErrors((prev) => ({ ...prev, message: "Please provide a bit more detail (at least 10 characters)." }));
    }
  };

  // Check if form is valid enough to enable the submit button
  const isFormValid = 
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.message.trim().length >= 10 &&
    !Object.values(errors).some(error => error !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final safety check
    if (!isValidName(formData.firstName) || !isValidName(formData.lastName) || !isValidEmail(formData.email)) {
      setErrors(prev => ({ 
        ...prev, 
        email: !isValidEmail(formData.email) ? "Invalid email." : prev.email 
      }));
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "38be796f-78dd-4efd-a0b6-ea008cb56266", 
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          message: formData.message,
          subject: "New Contact Form Submission - LocalSoko", 
          from_name: "LocalSoko Platform"
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus("success");
        // Clear the form
        setFormData({ firstName: "", lastName: "", email: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (error) {
      console.error("Submission Error:", error);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-12 pt-8">
      
      {/* Header Section */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-full mb-6 ring-4 ring-emerald-50/50">
          <MessageSquare className="h-12 w-12 text-emerald-600" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
          Let's talk about <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
            your business.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          Whether you need technical support, have a billing question, or want to explore enterprise partnerships, our team is here to help you scale.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-12 items-start">
        
        {/* Left Column: Contact Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
            
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-2">
                <HelpCircle className="h-6 w-6 text-emerald-600" /> Merchant Support
              </h3>
              <p className="text-slate-500 font-medium mb-4">Need help setting up your digital products or routing your payouts?</p>
              <a href="mailto:support@localsoko.com" className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                <Mail className="h-5 w-5" /> support@localsoko.com
              </a>
            </div>

            <div className="h-px w-full bg-slate-100"></div>

            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-2">
                <Briefcase className="h-6 w-6 text-blue-600" /> Enterprise & Sales
              </h3>
              <p className="text-slate-500 font-medium mb-4">Processing high volumes or need custom API integrations?</p>
              <a href="mailto:hello@localsoko.com" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors">
                <Mail className="h-5 w-5" /> hello@localsoko.com
              </a>
            </div>

            <div className="h-px w-full bg-slate-100"></div>

            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-2">
                <Globe className="h-6 w-6 text-slate-700" /> Global HQ
              </h3>
              <p className="text-slate-500 font-medium flex items-start gap-2 mt-3">
                <MapPin className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Nairobi, Kenya<br />
                  Building the future of borderless African commerce.
                </span>
              </p>
            </div>

          </div>
        </div>

        {/* Right Column: The Form */}
        <div className="lg:col-span-3 bg-slate-900 p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-900/20 text-white">
          <div className="mb-8">
            <h2 className="text-2xl font-black mb-2">Send us a message</h2>
            <p className="text-slate-400 font-medium">We typically respond within 24 hours.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-wider">First Name</label>
                <input 
                  required 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-5 py-4 rounded-xl border outline-none transition-all font-medium ${
                    errors.firstName 
                      ? 'bg-red-500/10 border-red-500/50 text-red-200 focus:ring-red-500' 
                      : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                  }`} 
                  placeholder="Jane"
                />
                {errors.firstName && <p className="text-red-400 text-xs ml-1 font-medium">{errors.firstName}</p>}
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-wider">Last Name</label>
                <input 
                  required 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`w-full px-5 py-4 rounded-xl border outline-none transition-all font-medium ${
                    errors.lastName 
                      ? 'bg-red-500/10 border-red-500/50 text-red-200 focus:ring-red-500' 
                      : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                  }`} 
                  placeholder="Doe"
                />
                {errors.lastName && <p className="text-red-400 text-xs ml-1 font-medium">{errors.lastName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-wider">Email Address</label>
              <input 
                required 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-5 py-4 rounded-xl border outline-none transition-all font-medium ${
                  errors.email 
                    ? 'bg-red-500/10 border-red-500/50 text-red-200 focus:ring-red-500' 
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                }`} 
                placeholder="jane@company.com"
              />
              {errors.email && <p className="text-red-400 text-xs ml-1 font-medium">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-wider">Message</label>
              <textarea 
                required 
                rows={5} 
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`w-full px-5 py-4 rounded-xl border outline-none transition-all font-medium resize-none ${
                  errors.message 
                    ? 'bg-red-500/10 border-red-500/50 text-red-200 focus:ring-red-500' 
                    : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                }`} 
                placeholder="How can our team help you?"
              ></textarea>
              {errors.message && <p className="text-red-400 text-xs ml-1 font-medium">{errors.message}</p>}
            </div>

            {status === "error" && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold text-sm">
                Something went wrong. Please try again later.
              </div>
            )}

            {status === "success" ? (
              <div className="flex items-center justify-center gap-3 bg-emerald-500/10 text-emerald-400 font-bold py-5 rounded-xl border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
                <CheckCircle className="h-6 w-6" /> Message Received Successfully!
              </div>
            ) : (
              <button 
                type="submit"
                disabled={status === "submitting" || !isFormValid} 
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 text-lg"
              >
                {status === "submitting" ? (
                  <><Loader2 className="h-6 w-6 animate-spin" /> Sending securely...</>
                ) : (
                  <><Send className="h-6 w-6" /> Send Message</>
                )}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}