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
  Users,
  Settings // UPGRADE: Added Settings icon
} from "lucide-react";
import Link from "next/link";

// 1. Secure Server-Side Supabase Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0; // Always fetch fresh data

export default async function StoresPage() {
  // UPGRADE: Fetching the order count to see which stores are actively selling!
  const { data: stores, error } = await supabaseAdmin
    .from('stores')
    .select(`
      *,
      orders ( id )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching stores:", error);
  }

  // 3. Quick calculations for header stats
  const activeStores = stores?.filter(s => s.status === 'active' || !s.status) || []; // Defaulting to active if status column isn't strict
  const connectedStores = stores?.filter(s => s.paystack_subaccount_code) || [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Stores Directory</h1>
          <p className="text-slate-500 font-medium mt-1">Manage merchants and their platform status.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <p className="text-sm font-bold text-slate-700">{activeStores.length} Active</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <p className="text-sm font-bold text-slate-700">{connectedStores.length} Connected</p>
          </div>
        </div>
      </div>

      {/* CONTROLS (Search & Filter) */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search stores by name..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm">
          <Filter className="h-5 w-5" /> Filter
        </button>
      </div>

      {/* STORES TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Store Info</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gateway Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores && stores.length > 0 ? (
                stores.map((store) => {
                  const orderCount = store.orders ? store.orders.length : 0;
                  return (
                    <tr key={store.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-center shrink-0">
                            <Store className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{store.name}</p>
                            <p className="text-xs text-slate-500 font-medium">Joined {new Date(store.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700">{store.county || "Online"}</p>
                        <p className="text-xs text-slate-500">{store.town || "N/A"}</p>
                      </td>

                      <td className="px-6 py-4">
                        {store.paystack_subaccount_code ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-wide">
                            <LinkIcon className="h-3 w-3" /> Connected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-wide">
                            <Unlink className="h-3 w-3" /> Unlinked
                          </span>
                        )}
                      </td>
                      
                      {/* NEW COLUMN: Order Count */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-700">{orderCount}</span>
                      </td>

                      {/* ACTION BUTTONS */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1. Public Store Link */}
                          <Link 
                            href={`/${store.slug || store.id}`} 
                            target="_blank"
                            className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors p-2 hover:bg-emerald-50 rounded-lg"
                            title="View Public Store"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          
                          {/* 2. Internal Admin Dashboard Manage Link */}
                          <Link 
                            href={`/admin/dashboard/stores/${store.id}`} 
                            className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors p-2 hover:bg-indigo-50 rounded-lg"
                          >
                            Manage <Settings className="h-4 w-4" />
                          </Link>
                        </div>
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