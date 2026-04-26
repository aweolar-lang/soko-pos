import { createClient } from "@supabase/supabase-js";
import { 
  DollarSign, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle,
  Clock
} from "lucide-react";

// 1. Secure Server-Side Supabase Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0; // Always fetch fresh data

export default async function TransactionsPage() {
  // 2. Fetch all transactions, and gracefully join the linked Store and Order data
  const { data: transactions, error } = await supabaseAdmin
    .from('transactions')
    .select(`
      *,
      stores ( name ),
      orders ( customer_name, customer_email )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
  }

  // 3. Quick calculations for the header stats
  const successfulTx = transactions?.filter(tx => tx.status === 'success') || [];
  const totalVolume = successfulTx.reduce((sum, tx) => sum + Number(tx.amount), 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Money Flow</h1>
          <p className="text-slate-500 font-medium mt-1">A complete ledger of all platform payments.</p>
        </div>
        
        {/* Quick Stats Mini-Cards */}
        <div className="flex gap-4">
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total Volume</p>
              <p className="text-lg font-black text-slate-900">Ksh {totalVolume.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 hidden sm:flex">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ArrowDownLeft className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Transactions</p>
              <p className="text-lg font-black text-slate-900">{successfulTx.length}</p>
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
            placeholder="Search by reference or customer..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
          />
        </div>
        <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors text-sm">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Ref</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Store / Origin</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx) => {
                  const txDate = new Date(tx.created_at).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                  });
                  const txTime = new Date(tx.created_at).toLocaleTimeString('en-US', { 
                    hour: '2-digit', minute: '2-digit' 
                  });
                  
                  // @ts-ignore
                  const storeName = tx.stores?.name || "Platform Subscription";
                  // @ts-ignore
                  const customerName = tx.orders?.customer_name || "Merchant";

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                      {/* DATE & REF */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{txDate}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-medium text-slate-500">{txTime}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {tx.reference.substring(0, 8)}...
                          </span>
                        </div>
                      </td>

                      {/* STORE */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{storeName}</span>
                        </div>
                      </td>

                      {/* CUSTOMER */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-900">{customerName}</p>
                        {/* @ts-ignore */}
                        {tx.orders?.customer_email && (
                          <p className="text-xs text-slate-500 truncate max-w-[150px]">
                            {/* @ts-ignore */}
                            {tx.orders.customer_email}
                          </p>
                        )}
                      </td>

                      {/* AMOUNT */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-black text-slate-900">
                          Ksh {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        {tx.status === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Success
                          </span>
                        ) : tx.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="h-3.5 w-3.5" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            <Clock className="h-3.5 w-3.5" /> {tx.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                        <DollarSign className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">No transactions yet</p>
                      <p className="text-xs text-slate-500 mt-1">When customers pay, they will appear here.</p>
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