import { createClient } from "@supabase/supabase-js";
import { 
  Store, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  Link as LinkIcon,
  Unlink,
  ExternalLink,
  Users
} from "lucide-react";
import Link from "next/link";

// 1. Secure Server-Side Supabase Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0; // Always fetch fresh data

export default async function StoresPage() {
  // 2. Fetch all stores
  const { data: stores, error } = await supabaseAdmin
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching stores:", error);
  }

  // 3. Quick calculations for header stats
  const activeStores = stores?.filter(s => s.status === 'active' || !s.status) || []; // Defaulting to active if status column isn't strict
  const connectedStores = stores?.filter(s => s.paystack_subaccount_id) || [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Registered Stores</h1>
          <p className="text-slate-500 font-medium mt-1">Manage merchants and their payout connections.</p>
        </div>
        
        {/* Quick Stats Mini-Cards */}
        <div className="flex gap-4">
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Store className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total Stores</p>
              <p className="text-lg font-black text-slate-900">{stores?.length || 0}</p>
            </div>
          </div>
          <div className="bg-white px-4 py-3 rounded-2xl border border-emerald-200 shadow-sm flex items-center gap-3 hidden sm:flex">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <LinkIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase">Ready for Payouts</p>
              <p className="text-lg font-black text-slate-900">{connectedStores.length}</p>
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
            placeholder="Search stores by name..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors text-sm">
            <Filter className="h-4 w-4" /> Filters
          </button>
        </div>
      </div>

      {/* STORES TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Store Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Payout Connection</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores && stores.length > 0 ? (
                stores.map((store) => {
                  const joinDate = new Date(store.created_at).toLocaleDateString('en-US', { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                  });

                  return (
                    <tr key={store.id} className="hover:bg-slate-50 transition-colors group">
                      {/* DATE */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{joinDate}</p>
                      </td>

                      {/* STORE DETAILS */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200">
                            <Store className="h-5 w-5 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{store.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                              {store.description || "No description provided."}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {store.category || "Uncategorized"}
                        </span>
                      </td>

                      {/* PAYOUT CONNECTION (SUBACCOUNT) */}
                      <td className="px-6 py-4">
                        {store.paystack_subaccount_id ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 mt-1">
                              {store.paystack_subaccount_id}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="h-3.5 w-3.5" /> Pending Setup
                          </span>
                        )}
                      </td>

                      {/* ACTION BUTTON */}
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/${store.id}`} // Links out to their public store page
                          target="_blank"
                          className="inline-flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors p-2 hover:bg-emerald-50 rounded-lg"
                        >
                          Visit <ExternalLink className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                        <Users className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-lg font-black text-slate-900">No stores registered yet</p>
                      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                        When merchants sign up and create their shops, they will appear in this directory.
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