"use client";

import { useEffect, useState } from "react";
import { 
  CheckCircle2, ShieldCheck, Zap, Crown, Loader2, 
  AlertTriangle, Star, CalendarDays, CreditCard, Store
} from "lucide-react";
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

  // Add this new state
  const [hasStore, setHasStore] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use maybeSingle() instead of single() so it doesn't throw a hard error if no store exists
        const { data: store, error } = await supabase
          .from('stores')
          .select('trial_ends_at, subscription_ends_at, tier')
          .eq('owner_id', user.id)
          .maybeSingle(); 

        if (error) throw error;

        if (store) {
          setHasStore(true);
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
        } else {
          // No store found for this user!
          setHasStore(false);
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

  // ==========================================
  // VIEW 0: NO STORE FOUND (Strict Gatekeeper)
  // ==========================================
  if (hasStore === false) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 sm:p-12 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <Store className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            You need a store first!
          </h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            You cannot subscribe to a premium plan because you haven't set up your store profile and payment details yet.
          </p>
          <a 
            href="/dashboard/settings" // Or whatever your store setup route is (e.g., /store-setup)
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-8 rounded-xl transition-all active:scale-[0.98]"
          >
            <Store className="h-5 w-5" />
            Set Up Your Store Now
          </a>
        </div>
      </div>
    );
  }

  // Calculate the exactly distinct states
  const isPaidActive = storeStatus && !storeStatus.isSubExpired && storeStatus.tier !== 'FREE';
  const isTrialActive = storeStatus && !storeStatus.isTrialExpired && storeStatus.tier === 'FREE';
  const isLockedOut = storeStatus && storeStatus.isTrialExpired && storeStatus.isSubExpired;

  // ==========================================
  // VIEW 1: PREMIUM DASHBOARD (Already Subscribed)
  // ==========================================
  if (isPaidActive) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-24 sm:pb-12">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Billing & Subscription</h1>
          <p className="mt-1.5 sm:mt-2 text-sm text-slate-500">
            Manage your premium seller account.
          </p>
        </div>

        {/* High-Grade Premium Card */}
        <div className="bg-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider border border-emerald-500/20">
                <Star className="h-3.5 w-3.5 fill-emerald-400" />
                Active Subscription
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                {storeStatus.tier.replace('_', ' ')} Plan
              </h2>
              
              <p className="text-slate-400 max-w-md text-sm">
                Thank you for being a premium seller on LocalSoko. Your storefront is fully unlocked and optimized for maximum sales.
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 min-w-[240px] shadow-inner">
              <div className="flex items-center gap-3 text-slate-300 mb-2">
                <CalendarDays className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-bold">Valid Until</span>
              </div>
              <p className="text-xl font-black text-white">
                {storeStatus.subEnds?.toLocaleDateString('en-KE', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          <div className="relative z-10 mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row gap-4">
            <button disabled className="bg-slate-800 text-slate-400 px-6 py-3 rounded-xl font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Store is fully active
            </button>
            <p className="text-xs text-slate-500 flex items-center px-2">
              (You cannot purchase a new plan while your current one is active)
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2 & 3: TRIAL OR EXPIRED (Shows Pricing)
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-12">
      
      {/* Dynamic Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {isLockedOut ? "Reactivate Your Store" : "Upgrade Your Store"}
        </h1>
        <p className="mt-1.5 sm:mt-2 text-sm text-slate-500">
          {isLockedOut 
            ? "Your access has expired. Choose a plan to bring your store back online." 
            : "Choose a plan to keep your storefront active and unlock premium features."}
        </p>

        {isLockedOut && (
          <div className="mt-5 sm:mt-6 bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-red-800">Your access has expired</h3>
              <p className="mt-1 text-sm text-red-600">
                Your 7-day trial has ended. Please select a package below to reactivate your store and continue accepting orders.
              </p>
            </div>
          </div>
        )}

        {isTrialActive && (
          <div className="mt-5 sm:mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
            <Zap className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-emerald-800">Trial Active</h3>
              <p className="mt-1 text-sm text-emerald-600">
                You are currently on the free trial. It expires on <span className="font-bold">{storeStatus?.trialEnds?.toLocaleDateString()}</span>. Upgrade now to ensure no interruptions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 pt-4 sm:pt-6">
        
        {/* 1 Month Plan */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all relative flex flex-col group">
          <div className="mb-5 sm:mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              1 Month
            </h3>
            <p className="text-sm text-slate-500 mt-2">Perfect for testing the waters.</p>
          </div>
          <div className="mb-5 sm:mb-6">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">Ksh 350</span>
            <span className="text-slate-500 font-medium">/mo</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" /> Live Storefront
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" /> Unlimited Products
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" /> Basic Support
            </li>
          </ul>
          <button 
            onClick={() => handleSubscribe("1_MONTH", 350)}
            disabled={isProcessing !== null}
            className="w-full py-4 sm:py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
          >
            {isProcessing === "1_MONTH" ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Choose 1 Month"}
          </button>
        </div>

        {/* 1 Year Plan (Highlighted Best Value) */}
        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 p-6 sm:p-8 shadow-2xl relative flex flex-col transform lg:-translate-y-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
            Best Value
          </div>
          <div className="mb-5 sm:mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-emerald-400" />
              1 Year
            </h3>
            <p className="text-sm text-slate-400 mt-2">Maximum savings for serious sellers.</p>
          </div>
          <div className="mb-5 sm:mb-6">
            <span className="text-3xl sm:text-4xl font-black text-white">Ksh 1,000</span>
            <span className="text-slate-400 font-medium">/yr</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" /> Everything in 1 Month
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" /> Save Ksh 3,200 annually
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" /> Priority Support
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" /> "Verified" VIP Badge
            </li>
          </ul>
          <button 
            onClick={() => handleSubscribe("1_YEAR", 1)}
            disabled={isProcessing !== null}
            className="w-full py-4 sm:py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center shadow-lg shadow-emerald-500/20"
          >
            {isProcessing === "1_YEAR" ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Choose 1 Year"}
          </button>
        </div>

        {/* 6 Months Plan */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all relative flex flex-col group">
          <div className="mb-5 sm:mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
              6 Months
            </h3>
            <p className="text-sm text-slate-500 mt-2">A great balance of commitment and price.</p>
          </div>
          <div className="mb-5 sm:mb-6">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">Ksh 650</span>
            <span className="text-slate-500 font-medium">/6mo</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" /> Live Storefront
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" /> Unlimited Products
            </li>
            <li className="flex items-center gap-3 text-sm text-slate-700 font-medium">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" /> Basic Support
            </li>
          </ul>
          <button 
            onClick={() => handleSubscribe("6_MONTHS", 650)}
            disabled={isProcessing !== null}
            className="w-full py-4 sm:py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
          >
            {isProcessing === "6_MONTHS" ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Choose 6 Months"}
          </button>
        </div>

      </div>
    </div>
  );
}