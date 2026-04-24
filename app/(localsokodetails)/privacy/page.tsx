import { Database, Eye, Trash2, ShieldCheck, Share2, Globe, FileDown, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-12 pt-8">
      
      {/* Hero Section */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-full mb-6 ring-4 ring-emerald-50/50">
          <Database className="h-12 w-12 text-emerald-600" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
          Global Privacy & <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
            Data Policy.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          As a borderless e-commerce platform, we collect only what is necessary to facilitate secure, global commerce. Your data is your business.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* 1. What We Collect */}
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-6">
            <Eye className="h-7 w-7 text-emerald-600 bg-emerald-50 p-1.5 rounded-xl" /> 
            What We Collect
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-5 w-5 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-lg">Merchant Data</h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">Names, locations, phone numbers, and encrypted routing information (M-Pesa Till numbers or International Bank Codes) for automated global payouts.</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <FileDown className="h-5 w-5 text-purple-600" />
                <h4 className="font-bold text-slate-900 text-lg">Buyer & Order Data</h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">Email addresses (strictly for digital download receipts), shipping addresses, and transaction timestamps. We never store credit card numbers.</p>
            </div>
          </div>
        </div>

        {/* 2. Data Sharing */}
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-4">
            <Share2 className="h-7 w-7 text-blue-600 bg-blue-50 p-1.5 rounded-xl" /> 
            Data Sharing & Partners
          </h2>
          <p className="text-slate-600 font-medium leading-relaxed mb-6">
            LocalSoko <strong>never</strong> sells your data to third-party marketers. We only share necessary encrypted data with our strictly vetted infrastructure partners:
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block mb-1">Paystack (A Stripe Company)</strong>
                <span className="text-sm text-slate-600 font-medium">Used to process international credit cards, process USD/KES conversions, and settle funds securely into your bank or mobile wallet.</span>
              </div>
            </li>
            <li className="flex items-start gap-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <Lock className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block mb-1">Supabase</strong>
                <span className="text-sm text-slate-600 font-medium">Used for enterprise-grade database hosting, Row-Level Security (RLS) enforcement, and encrypted digital file storage.</span>
              </div>
            </li>
          </ul>
        </div>

        {/* 3. Account Scrubbing */}
        <div className="bg-slate-900 p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-900/20 text-white border border-slate-800 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          <div className="shrink-0 bg-red-500/20 p-4 rounded-full border border-red-500/30">
            <Trash2 className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white mb-3">Account Scrubbing (Right to be Forgotten)</h2>
            <p className="text-slate-300 font-medium leading-relaxed mb-4">
              You own your store data. If you choose to close your LocalSoko account or pivot your business, you can request a full "Data Scrub." We will permanently delete your inventory files, sales history, and personal identifiers from our production databases within 30 days.
            </p>
            <p className="text-sm text-emerald-400 font-bold bg-emerald-400/10 inline-block px-4 py-2 rounded-xl border border-emerald-400/20">
              Questions? Contact our compliance officer at privacy@localsoko.com
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}