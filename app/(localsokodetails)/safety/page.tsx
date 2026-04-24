import { ShieldCheck, CreditCard, UserCheck, Lock, Landmark, AlertCircle, Globe, FileDown } from "lucide-react";

export default function SafetyPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-12 pt-8">
      
      {/* Hero Section */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-full mb-6 ring-4 ring-emerald-50/50">
          <ShieldCheck className="h-12 w-12 text-emerald-600" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
          Enterprise-Grade <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
            Trust & Security.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          From local M-Pesa transfers to global credit card processing and digital asset delivery, we protect every transaction in the LocalSoko ecosystem.
        </p>
      </div>

      {/* Security Pillars Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Pillar 1: Global Payments */}
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:border-blue-100 transition-colors">
          <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
            <Globe className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Global Payment Routing</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            LocalSoko uses <strong>Paystack</strong> (a Stripe company) as our verified payment gateway. Whether a buyer pays in USD or KES, funds are securely captured and automatically routed. We never store credit card data on our servers.
          </p>
        </div>

        {/* Pillar 2: Payouts & KYC */}
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:border-emerald-100 transition-colors">
          <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
            <Landmark className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Verified Merchant Payouts</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            Every merchant must undergo strict Know Your Customer (KYC) verification before processing payments. Payouts are strictly locked to verified <strong>M-Pesa Till numbers</strong> or official <strong>International Bank Accounts</strong> to prevent fraud.
          </p>
        </div>

        {/* Pillar 3: Digital Asset Protection */}
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:border-purple-100 transition-colors">
          <div className="bg-purple-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
            <FileDown className="h-7 w-7 text-purple-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Digital Asset Protection</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            When purchasing an eBook, course, or software, files are delivered using <strong>cryptographically signed, time-limited URLs</strong>. This ensures that digital goods cannot be easily shared or pirated across the public internet.
          </p>
        </div>

        {/* Pillar 4: Data & Infrastructure */}
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:border-slate-300 transition-colors">
          <div className="bg-slate-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
            <Lock className="h-7 w-7 text-slate-700" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Data Isolation & Privacy</h2>
          <p className="text-slate-600 leading-relaxed font-medium">
            Powered by <strong>Supabase</strong>, our database implements strict Row-Level Security (RLS). Store data, inventory logs, and financial records are heavily isolated—meaning one merchant can never access another merchant's analytics or buyer data.
          </p>
        </div>

      </div>

      {/* SokoPOS Warning Section */}
      <div className="mt-8 bg-slate-900 p-8 sm:p-12 rounded-[2.5rem] shadow-xl shadow-slate-900/20 text-white flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 border border-slate-800">
        <div className="shrink-0 bg-red-500/20 p-4 rounded-full border border-red-500/30">
          <AlertCircle className="h-10 w-10 text-red-400" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-white mb-3">SokoPOS Physical Safety Notice</h3>
          <p className="text-slate-300 font-medium leading-relaxed text-lg">
            While our digital infrastructure is fortified, physical merchants using <strong>SokoPOS</strong> must remain vigilant against in-person "social engineering" scams. <br className="hidden sm:block" />
            <span className="text-white font-bold mt-2 inline-block">Always verify successful funds in your LocalSoko Orders Dashboard or official Paystack app before handing over physical goods. Do not rely solely on customer SMS screens.</span>
          </p>
        </div>
      </div>
      
    </div>
  );
}