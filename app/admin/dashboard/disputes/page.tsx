import { createClient } from "@supabase/supabase-js";
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";

// 1. Secure Server-Side Supabase Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0; // Always fetch fresh data

export default async function DisputesPage() {
  // 2. Fetch all disputes and join the linked Store and Order data
  const { data: disputes, error } = await supabaseAdmin
    .from('disputes')
    .select(`
      *,
      stores ( name ),
      orders ( customer_name, customer_email )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching disputes:", error);
  }

  // 3. Quick calculations for the header stats
  const activeDisputes = disputes?.filter(d => d.status === 'open' || d.status === 'needs_attention') || [];
  const resolvedDisputes = disputes?.filter(d => d.status === 'resolved') || [];
  const totalDisputedAmount = activeDisputes.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Disputes & Alerts</h1>
          <p className="text-slate-500 font-medium mt-1">Manage chargebacks, complaints, and flagged payments.</p>
        </div>
        
        {/* Quick Stats Mini-Cards */}
        <div className="flex gap-4">
          <div className="bg-white px-4 py-3 rounded-2xl border border-red-200 shadow-sm flex items-center gap-3 relative overflow-hidden">
            {activeDisputes.length > 0 && <div className="absolute top-0 right-0 w-1 h-full bg-red-500 animate-pulse"></div>}
            <div className="p-2 bg-red-50 rounded-lg">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-600 uppercase">Action Required</p>
              <p className="text-lg font-black text-slate-900">{activeDisputes.length}</p>
            </div>
          </div>
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 hidden sm:flex">
            <div className="p-2 bg-slate-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Amount at Risk</p>
              <p className="text-lg font-black text-slate-900">Ksh {totalDisputedAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by transaction reference..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-sm">
            Active Only
          </button>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors text-sm">
            <Filter className="h-4 w-4" /> All
          </button>
        </div>
      </div>

      {/* DISPUTES TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Ref</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Store & Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {disputes && disputes.length > 0 ? (
                disputes.map((dispute) => {
                  const dDate = new Date(dispute.created_at).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                  });
                  
                  // @ts-ignore
                  const storeName = dispute.stores?.name || "Unknown Store";
                  // @ts-ignore
                  const customerName = dispute.orders?.customer_name || "Unknown Buyer";

                  return (
                    <tr key={dispute.id} className="hover:bg-slate-50 transition-colors group">
                      {/* DATE & REF */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{dDate}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {dispute.transaction_reference.substring(0, 10)}...
                        </span>
                      </td>

                      {/* STORE & CUSTOMER */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{storeName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          Buyer: <span className="font-medium text-slate-700">{customerName}</span>
                        </p>
                      </td>

                      {/* REASON */}
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-sm text-slate-700 truncate" title={dispute.reason}>
                          {dispute.reason || "No reason provided by bank."}
                        </p>
                      </td>

                      {/* AMOUNT */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-900">
                          Ksh {Number(dispute.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        {dispute.status === 'open' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <AlertCircle className="h-3.5 w-3.5" /> Open
                          </span>
                        ) : dispute.status === 'needs_attention' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            <Clock className="h-3.5 w-3.5" /> Reminded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                          </span>
                        )}
                      </td>

                      {/* ACTION BUTTON */}
                      <td className="px-6 py-4 text-right">
                        <button className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors p-2 hover:bg-emerald-50 rounded-lg">
                          View <ArrowUpRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="h-8 w-8 text-emerald-500" />
                      </div>
                      <p className="text-lg font-black text-slate-900">Zero Active Disputes</p>
                      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                        Your merchants are doing a great job! If a customer files a chargeback or dispute, it will show up here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}