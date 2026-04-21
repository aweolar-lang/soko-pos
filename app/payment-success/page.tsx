"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Store, Receipt, Loader2 } from "lucide-react";

// 1. We move your core logic into a separate "Content" component
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  
  const reference = searchParams.get("reference");

  useEffect(() => {
    if (reference) {
      setStatus("success");
    } else {
      setStatus("error");
    }
  }, [reference]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-slate-500 font-medium">Verifying your payment...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 max-w-md w-full text-center border border-slate-100">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <span className="text-red-600 font-black text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Not Found</h2>
          <p className="text-slate-500 mb-8">We couldn't verify this transaction. If you were charged, please contact support.</p>
          <Link href="https://localsoko.com" className="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-800 transition-all">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12 selection:bg-emerald-200">
      <div className="mb-8 text-center">
        <Link href="https://localsoko.com" className="inline-flex items-center gap-2 text-emerald-600 font-black text-2xl tracking-tight">
          <Store className="h-8 w-8" />
          LocalSoko
        </Link>
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 max-w-md w-full text-center border border-slate-100 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Payment Successful!</h2>
          <p className="text-slate-500 mb-8">
            Thank you for your purchase. Your payment has been securely processed.
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 mb-8 border border-slate-100 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">Transaction Ref</span>
              <span className="text-sm font-bold text-slate-900 break-all pl-4">{reference}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Status</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">Paid</span>
            </div>
          </div>

          <Link 
            href="https://localsoko.com" 
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all active:scale-95"
          >
            <Receipt className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

// 2. We wrap it in a Suspense boundary in the main default export!
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading...</p>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}