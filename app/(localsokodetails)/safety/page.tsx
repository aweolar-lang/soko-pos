import { ShieldCheck, CreditCard, UserCheck, Lock, Landmark, AlertCircle } from "lucide-react";

export default function SafetyPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
        <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Trust & Infrastructure</h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">How we secure the LocalSoko ecosystem</p>
        </div>
      </div>

      <div className="prose max-w-none text-slate-600 space-y-10 font-medium leading-relaxed">
        
        {/* 1. Payment Security */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" /> 1. Secure Money Distribution
          </h2>
          <p>
            LocalSoko uses <strong>Paystack</strong> for all financial routing. When a buyer pays online, the funds are held securely and distributed via Paystack Subaccounts. This ensures that:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Funds are routed automatically to the correct merchant.</li>
            <li>No human at LocalSoko handles your raw credit card or M-Pesa PIN data.</li>
            <li>All transactions are protected by PCI-DSS Level 1 certification.</li>
          </ul>
        </section>

        {/* 2. Merchant Verification */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-600" /> 2. Verified Merchant Accounts
          </h2>
          <p>
            Every store on LocalSoko undergoes a verification process. We verify <strong>Paybill/Till numbers</strong> and merchant identities through our integration with Paystack's KYC (Know Your Customer) framework. This prevents "ghost stores" from operating on the platform.
          </p>
        </section>

        {/* 3. Data Integrity */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-600" /> 3. Infrastructure Security
          </h2>
          <p>
            Your store data, inventory, and sales records are stored using **Supabase** with Row-Level Security (RLS). This means that even within our database, one store owner can never "peek" into another store's financial data.
          </p>
        </section>

        {/* POS Warning */}
        <div className="bg-slate-900 p-8 rounded-3xl text-white space-y-4">
          <h3 className="font-black flex items-center gap-2 text-emerald-400">
            <AlertCircle className="h-5 w-5" /> SokoPOS Physical Safety
          </h3>
          <p className="text-sm text-slate-300">
            While our digital systems are secure, physical merchants using <strong>SokoPOS</strong> should remain vigilant against "social engineering" scams, such as customers showing fake M-Pesa confirmation SMS messages. Always verify funds in your <strong>LocalSoko Wallet</strong> or Paystack Dashboard before handing over goods.
          </p>
        </div>
      </div>
    </div>
  );
}