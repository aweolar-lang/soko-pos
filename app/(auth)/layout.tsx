import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-0 w-full h-96 bg-emerald-600/5 -z-10 [mask-image:linear-gradient(to_bottom,white,transparent)]" />

      {/* Back Button Container */}
      <div className="max-w-md mx-auto w-full mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to LocalSoko
        </Link>
      </div>

      {/* Form Container */}
      <div className="max-w-md mx-auto w-full relative z-10">
        {children}
      </div>

    </div>
  );
}