import { Database, Eye, Trash2, ShieldCheck, Share2 } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="space-y-12">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
        <div className="bg-slate-900 p-3 rounded-2xl">
          <Database className="h-8 w-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Data Policy</h1>
          <p className="text-sm text-slate-500 font-bold uppercase">Transparency in a POS Environment</p>
        </div>
      </div>

      <div className="space-y-10 text-slate-600 font-medium leading-relaxed">
        
        {/* Collection */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Eye className="h-5 w-5 text-emerald-600" /> What We Collect
          </h2>
          <p>As a POS and Marketplace platform, we collect only what is necessary to facilitate commerce:</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Merchant Data</h4>
              <p className="text-xs mt-1">Names, phone numbers, and Paybill/Till info for automated payouts.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Transactional Data</h4>
              <p className="text-xs mt-1">Sale amounts, item names, and timestamps for your Wallet reporting.</p>
            </div>
          </div>
        </section>

        {/* Paystack Sharing */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-600" /> Data Sharing
          </h2>
          <p>
            LocalSoko does not sell your data. We share necessary data only with our core financial partners:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Paystack:</strong> To process payments and settle funds into your bank or M-Pesa account.</li>
            <li><strong>Supabase:</strong> For secure database hosting and authentication.</li>
          </ul>
        </section>

        {/* Deletion */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" /> Account Scrubbing
          </h2>
          <p>
            You own your store data. If you choose to close your LocalSoko account, you can request a full "Data Scrub." We will delete your inventory, sales history, and personal identifiers from our production databases within 30 days.
          </p>
        </section>

        <div className="mt-8 p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
          <p className="text-sm text-emerald-800 font-bold">
            Questions about your financial data? Contact our compliance officer at <span className="underline">privacy@localsoko.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}