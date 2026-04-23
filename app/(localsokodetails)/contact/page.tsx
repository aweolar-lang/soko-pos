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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid md:grid-cols-2">
          
          {/* Left Side: Contact Information */}
          <div className="bg-green-600 p-8 md:p-12 text-white flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-3xl font-black mb-4">Get in Touch</h1>
              <p className="text-green-100 text-lg leading-relaxed">
                Have a question about buying, selling, or your account? We are here to help. Reach out to the LocalSoko team!
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-green-500 p-3 rounded-full shrink-0">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-200 font-medium">Email Us</p>
                  <a href="mailto:hello@localsoko.com" className="text-lg font-semibold hover:text-green-200 transition-colors">
                    hello@localsoko.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-green-500 p-3 rounded-full shrink-0">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-200 font-medium">Call Us (Mon-Fri, 9am-5pm)</p>
                  <a href="tel:+254700000000" className="text-lg font-semibold hover:text-green-200 transition-colors">
                    +254 769 773 480
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-green-500 p-3 rounded-full shrink-0">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-200 font-medium">Headquarters</p>
                  <p className="text-lg font-semibold">
                    Nairobi, Kenya
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Contact Form */}
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Send a Message</h2>
            </div>
            
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 transition-all"
                    placeholder="John"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input 
                    type="text" 
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea 
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 transition-all resize-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              {/* Status Messages */}
              {status === "error" && (
                <p className="text-sm text-red-600 font-medium">Something went wrong. Please try again.</p>
              )}

              {status === "success" ? (
                <div className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 font-bold py-3 px-4 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5" />
                  Message Sent Successfully!
                </div>
              ) : (
                <button 
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm disabled:bg-green-400"
                >
                  {status === "submitting" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  {status === "submitting" ? "Sending..." : "Send Message"}
                </button>
              )}
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}