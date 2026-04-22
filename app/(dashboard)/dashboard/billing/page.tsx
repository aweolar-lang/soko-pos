"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Zap, Crown, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; 

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [storeStatus, setStoreStatus] = useState<{
    isTrialExpired: boolean;
    isSubExpired: boolean;
    trialEnds: Date | null;
    subEnds: Date | null;
    tier: string;
  } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: store, error } = await supabase
          .from('stores')
          .select('trial_ends_at, subscription_ends_at, tier')
          .eq('owner_id', session.user.id)
          .single();

        if (error) throw error;

        if (store) {
          const now = new Date();
          const trialEnds = new Date(store.trial_ends_at);
          const subEnds = store.subscription_ends_at ? new Date(store.subscription_ends_at) : null;

          setStoreStatus({
            isTrialExpired: now > trialEnds,
            isSubExpired: !subEnds || now > subEnds,
            trialEnds,
            subEnds,
            tier: store.tier,
          });
        }
      } catch (error) {
        console.error("Error fetching billing status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  const handleSubscribe = async (plan: string, amount: number) => {
    setIsProcessing(plan);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, amount }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to initialize payment.");

      // Redirect to Paystack secure checkout
      window.location.href = data.checkoutUrl;
      
    } catch (error: any) {
      toast.error(error.message);
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const isLockedOut = storeStatus?.isTrialExpired && storeStatus?.isSubExpired;
  const isPaidActive = !storeStatus?.isSubExpired && storeStatus?.tier !== 'FREE';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header & Status Banner */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Upgrade Your Store</h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose a plan to keep your storefront active and unlock premium features.
        </p>

        {/* 1. Locked Out Banner */}
        {isLockedOut && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-red-800">Your access has expired</h3>
              <p className="mt-1 text-sm text-red-600">
                Your 7-day trial has ended. Please select a package below to reactivate your store and continue accepting orders.
              </p>
            </div>
          </div>
        )}

        {/* 2. Free Trial Active Banner */}
        {!isLockedOut && !isPaidActive && storeStatus?.tier === 'FREE' && (
          <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-800">Trial Active</h3>
              <p className="mt-1 text-sm text-emerald-600">
                You are currently on the free trial. It expires on {storeStatus.trialEnds?.toLocaleDateString()}.
              </p>
            </div>
          </div>
        )}

        {/* 3. NEW: Paid Subscription Active Banner */}
        {isPaidActive && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-blue-800">Active {storeStatus?.tier} Subscription</h3>
              <p className="mt-1 text-sm text-blue-600">
                Thank you for subscribing! Your store is fully active until {storeStatus?.subEnds?.toLocaleDateString()}. You can renew early below.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        {/* 1 Month Plan */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-400" />
              1 Month
            </h3>
            <p className="text-sm text-slate-500 mt-2">Perfect for testing the waters.</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-black text-slate-900">Ksh 350</span>
            <span className="text-slate-500 font-medium">/mo</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Live Storefront
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Unlimited Products
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Basic Support
            </li>
          </ul>
          <button 
            onClick={() => handleSubscribe("1_MONTH", 5)}
            disabled={isProcessing !== null}
            className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {isProcessing === "1_MONTH" ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Choose 1 Month"}
          </button>
        </div>

        {/* 1 Year Plan (Highlighted Best Value) */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-xl relative flex flex-col transform md:-translate-y-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
            Best Value
          </div>
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-emerald-400" />
              1 Year
            </h3>
            <p className="text-sm text-slate-400 mt-2">Maximum savings for serious sellers.</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-black text-white">Ksh 1,000</span>
            <span className="text-slate-400 font-medium">/yr</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> Everything in 1 Month
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> Save Ksh 3,200 annually
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> Priority Support
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> "Verified" VIP Badge
            </li>
          </ul>
          <button 
            onClick={() => handleSubscribe("1_YEAR", 1000)}
            disabled={isProcessing !== null}
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {isProcessing === "1_YEAR" ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Choose 1 Year"}
          </button>
        </div>

        {/* 6 Months Plan */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-slate-400" />
              6 Months
            </h3>
            <p className="text-sm text-slate-500 mt-2">A great balance of commitment and price.</p>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-black text-slate-900">Ksh 650</span>
            <span className="text-slate-500 font-medium">/6mo</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Live Storefront
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Unlimited Products
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> Basic Support
            </li>
          </ul>
          <button 
            onClick={() => handleSubscribe("6_MONTHS", 650)}
            disabled={isProcessing !== null}
            className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {isProcessing === "6_MONTHS" ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Choose 6 Months"}
          </button>
        </div>

      </div>
    </div>
  );
}