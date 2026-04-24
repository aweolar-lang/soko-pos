import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
      
      {/* Icon Container */}
      <div className="w-20 h-20 bg-emerald-50 border-8 border-emerald-100/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail className="w-8 h-8" />
      </div>

      {/* Main Text */}
      <h1 className="text-2xl font-black text-slate-900 mb-3">Check your inbox</h1>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed px-4">
        We've sent a secure verification link to your email address. Please click the link to verify your account and access your dashboard.
      </p>

      {/* Call to Action */}
      <Link 
        href="/login"
        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all mb-6"
      >
        <span>Continue to Login</span>
        <ArrowRight className="w-4 h-4" />
      </Link>

      {/* Helpful Hint */}
      <div className="pt-6 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Didn't receive the email? <br className="hidden sm:block"/> 
          Be sure to check your spam or junk folder.
        </p>
      </div>

    </div>
  );
}