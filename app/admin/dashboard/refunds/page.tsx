import { createClient } from "@supabase/supabase-js";
import { 
  RefreshCcw, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle,
  Clock,
  ArrowUpRight
} from "lucide-react";

// 1. Secure Server-Side Supabase Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0; // Always fetch fresh data

export default async function RefundsPage() {
  // 2. Fetch all refunds and join the linked Store and Order data
  const { data: refunds, error } = await supabaseAdmin
    .from('refunds')
    .select(`
      *,
      stores ( name ),
      orders ( customer_name, customer_email )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching refunds:", error);
  }

  // 3. Quick calculations for the header stats
  const pendingRefunds = refunds?.filter(r => r.status === 'pending' || r.status === 'processing') || [];
  const processedRefunds = refunds?.filter(r => r.status === 'processed') || [];
  const totalRefundedAmount = processedRefunds.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Refunds</h1>
          <p className="text-slate-500 font-medium mt-1">Track money being returned to customers.</p>
        </div>
        
        {/* Quick Stats Mini-Cards */}
        <div className="flex gap-4">
          <div className="bg-white px-4 py-3 rounded-2xl border border-orange-200 shadow-sm flex items-center gap-3 relative overflow-hidden">
            {pendingRefunds.length > 0 && <div className="absolute top-0 right-0 w-1 h-full bg-orange-400"></div>}
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase">Pending</p>
              <p className="text-lg font-black text-slate-900">{pendingRefunds.length}</p>
            </div>
          </div>
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 hidden sm:flex">
            <div className="p-2 bg-slate-100 rounded-lg">
              <RefreshCcw className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total Returned</p>
              <p className="text-lg font-black text-slate-900">Ksh {totalRefundedAmount.toLocaleString()}</p>
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
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors text-sm">
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      {/* REFUNDS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Ref</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Store & Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {refunds && refunds.length > 0 ? (
                refunds.map((refund) => {
                  const rDate = new Date(refund.created_at).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                  });
                  
                  // @ts-ignore
                  const storeName = refund.stores?.name || "Unknown Store";
                  // @ts-ignore
                  const customerName = refund.orders?.customer_name || "Unknown Buyer";

                  return (
                    <tr key={refund.id} className="hover:bg-slate-50 transition-colors group">
                      {/* DATE & REF */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{rDate}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {refund.transaction_reference.substring(0, 10)}...
                        </span>
                      </td>

                      {/* STORE & CUSTOMER */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{storeName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          Buyer: <span className="font-medium text-slate-700">{customerName}</span>
                        </p>
                      </td>

                      {/* AMOUNT */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-900">
                          Ksh {Number(refund.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        {refund.status === 'processed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Processed
                          </span>
                        ) : refund.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="h-3.5 w-3.5" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            <Clock className="h-3.5 w-3.5" /> {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
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
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <RefreshCcw className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-lg font-black text-slate-900">No Refunds Found</p>
                      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                        There are currently no refund records on your platform.
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