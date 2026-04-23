"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Send, MessageSquare, CheckCircle, Loader2 } from "lucide-react";

export default function ContactPage() {
  // Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  
  // Submission Status State
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          name: `${firstName} ${lastName}`,
          email: email,
          message: message,
          subject: "New Contact Form Submission - LocalSoko", 
          from_name: "LocalSoko Contact Form"
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus("success");
        // Clear the form
        setFirstName("");
        setLastName("");
        setEmail("");
        setMessage("");
        
        // Reset the success message after 5 seconds
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        console.error("Web3Forms Error:", result);
        setStatus("error");
      }
    } catch (error) {
      console.error("Submission Error:", error);
      setStatus("error");
    }
  };

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contact Us</h1>
        <p className="mt-2 text-slate-500 font-medium">Have questions? We're here to help.</p>
      </div>

      <div className="grid md:grid-cols-5 gap-12">
        {/* Info Sidebar */}
        <div className="md:col-span-2 space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Reach Out</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-slate-600">
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm"><Mail className="h-5 w-5 text-emerald-600" /></div>
                <span className="font-bold text-sm">hello@localsoko.com</span>
              </div>
              <div className="flex items-center gap-4 text-slate-600">
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm"><Phone className="h-5 w-5 text-emerald-600" /></div>
                <span className="font-bold text-sm">+254 700 000 000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="md:col-span-3 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase ml-1">First Name</label>
              <input required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase ml-1">Last Name</label>
              <input required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 uppercase ml-1">Message</label>
            <textarea required rows={5} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium resize-none" placeholder="How can we help?"></textarea>
          </div>

          {status === "success" ? (
            <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 font-bold py-4 rounded-xl border border-emerald-100 animate-in fade-in zoom-in duration-300">
              <CheckCircle className="h-5 w-5" /> Message Sent!
            </div>
          ) : (
            <button disabled={status === "submitting"} className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
              {status === "submitting" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              Send Message
            </button>
          )}
        </form>
      </div>
    </div>
  );
}