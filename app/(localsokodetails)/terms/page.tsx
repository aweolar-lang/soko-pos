import { Scale, ShieldAlert, Globe, Landmark, FileDown, Gavel, FileText, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-12 pt-8">
      
      {/* Hero Section */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-4 bg-emerald-50 rounded-full mb-6 ring-4 ring-emerald-50/50">
          <Scale className="h-12 w-12 text-emerald-600" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
          Global Terms <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600">
            of Service.
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          The standard legal agreement for merchants and buyers operating within the LocalSoko borderless commerce ecosystem.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Block 1: Platform Role & Usage */}
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
          <section>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-4">
              <Globe className="h-6 w-6 text-emerald-600" /> 1. The Platform's Role
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              LocalSoko provides digital infrastructure (the "Platform") connecting independent Sellers with global and local Buyers. We are a venue and payment routing engine. We do not manufacture, store, or inspect physical items, nor do we create the digital assets sold. Consequently, LocalSoko is not liable for the quality, safety, or legality of items advertised by merchants.
            </p>
          </section>

          <div className="h-px w-full bg-slate-100"></div>

          <section>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-4">
              <FileDown className="h-6 w-6 text-blue-600" /> 2. Digital Assets & IP
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              Merchants selling digital goods (eBooks, software, courses) guarantee they hold the explicit Intellectual Property (IP) rights to distribute these files. LocalSoko reserves the right to instantly terminate accounts and freeze payouts for merchants found distributing pirated, stolen, or unauthorized digital content.
            </p>
          </section>
        </div>

        {/* Block 2: Prohibited Items (Warning UI) */}
        <div className="bg-slate-900 p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-900/20 text-white border border-slate-800">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-red-500/20 p-3 rounded-2xl border border-red-500/30">
              <ShieldAlert className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-white">3. Prohibited Conduct & Items</h2>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed mb-6">
            To maintain a secure global marketplace, users are strictly prohibited from listing, routing payments for, or selling:
          </p>
          <ul className="grid sm:grid-cols-2 gap-4">
            <li className="flex items-start gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-slate-300 font-medium text-sm">
              <CheckCircle2 className="h-5 w-5 text-red-400 shrink-0" /> Counterfeit goods, unauthorized replicas, or pirated digital media.
            </li>
            <li className="flex items-start gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-slate-300 font-medium text-sm">
              <CheckCircle2 className="h-5 w-5 text-red-400 shrink-0" /> Hazardous materials, illegal substances, or prescription drugs.
            </li>
            <li className="flex items-start gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-slate-300 font-medium text-sm">
              <CheckCircle2 className="h-5 w-5 text-red-400 shrink-0" /> Items or digital content that promote hate speech, discrimination, or violence.
            </li>
            <li className="flex items-start gap-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 text-slate-300 font-medium text-sm">
              <CheckCircle2 className="h-5 w-5 text-red-400 shrink-0" /> Fraudulent services, multi-level marketing (MLM) schemes, or scams.
            </li>
          </ul>
        </div>

        {/* Block 3: Financials */}
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
          <section>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-4">
              <Landmark className="h-6 w-6 text-emerald-600" /> 4. Global Payouts & Liability
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              LocalSoko partners with verified payment gateways (e.g., Paystack) to route international and local payments. Sellers are responsible for ensuring their connected M-Pesa Till or Bank Account is accurate. LocalSoko is not liable for funds sent to incorrectly inputted merchant routing numbers, nor are we liable for "Reversal Scams" executed outside of our official payment gateway.
            </p>
          </section>

          <div className="h-px w-full bg-slate-100"></div>

          <section>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-4">
              <FileText className="h-6 w-6 text-purple-600" /> 5. Subscriptions & Billing
            </h2>
            <p className="text-slate-600 leading-relaxed font-medium">
              Merchants may access premium enterprise features via a subscription plan. All platform infrastructure fees are non-refundable. Trial periods are restricted to one per verified user identity, and LocalSoko reserves the right to terminate trials immediately upon detecting account duplication or abuse.
            </p>
          </section>
        </div>

        {/* Footer Contact */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <div className="inline-flex items-center gap-2 text-slate-500 font-medium bg-slate-100 px-6 py-3 rounded-full border border-slate-200">
            <Gavel className="h-5 w-5" />
            For formal legal inquiries, please contact <a href="mailto:legal@localsoko.com" className="font-bold text-slate-900 hover:text-emerald-600 transition-colors">legal@localsoko.com</a>
          </div>
        </div>

      </div>
    </div>
  );
}