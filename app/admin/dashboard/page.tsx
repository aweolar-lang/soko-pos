import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { 
  Activity, 
  AlertTriangle, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Store,
  ArrowRight,
  RefreshCcw,
  ShieldCheck
} from "lucide-react";

// 1. Secure Server-Side Supabase Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0; // Always fetch fresh data on load

export default async function AdminDashboard() {
  // 2. Fetch all our metrics in parallel for maximum speed
  const [
    { data: transactions },
    { count: openDisputes },
    { count: pendingRefunds },
    { count: totalStores },
    { count: totalOrders },
    { data: recentAlerts }
  ] = await Promise.all([
    // Total volume (Successful payments)
    supabaseAdmin.from('transactions').select('amount').eq('status', 'success').eq('type', 'payment'),
    // Active disputes
    supabaseAdmin.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'needs_attention']),
    // Pending refunds
    supabaseAdmin.from('refunds').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
    // Total stores
    supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }),
    // Total orders
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    // Get the 5 most recent disputes for the live feed
    supabaseAdmin.from('disputes').select('*, stores(name)').order('created_at', { ascending: false }).limit(5)
  ]);

  // 3. Calculate Total Revenue Volume
  const totalVolume = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">System Overview</h1>
            <p className="text-slate-500 font-medium mt-1">Monitor platform money flow, alerts, and health.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              System Online
            </span>
          </div>
        </div>

        {/* TOP STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1. Money Flow */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Volume</h2>
            </div>
            <p className="text-3xl font-black text-slate-900">
              Ksh {totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* 2. Platform Growth (Stores & Orders) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Platform Activity</h2>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-2xl font-black text-slate-900">{totalOrders || 0}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase">Orders</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{totalStores || 0}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase">Stores</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Pending Refunds */}
          <div className="bg-white p-6 rounded-3xl border border-orange-200 shadow-sm flex flex-col relative overflow-hidden">
            {pendingRefunds ? <div className="absolute top-0 right-0 w-1.5 h-full bg-orange-400"></div> : null}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <RefreshCcw className="h-6 w-6 text-orange-600" />
              </div>
              <h2 className="text-sm font-bold text-orange-600 uppercase tracking-wider">Pending Refunds</h2>
            </div>
            <p className="text-3xl font-black text-slate-900">{pendingRefunds || 0}</p>
          </div>

          {/* 4. Active Disputes */}
          <div className="bg-white p-6 rounded-3xl border border-red-200 shadow-sm flex flex-col relative overflow-hidden">
            {openDisputes ? <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500 animate-pulse"></div> : null}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-sm font-bold text-red-600 uppercase tracking-wider">Active Disputes</h2>
            </div>
            <p className="text-3xl font-black text-slate-900">{openDisputes || 0}</p>
            {openDisputes ? (
              <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1">
                Requires immediate action
              </p>
            ) : (
              <p className="text-xs font-bold text-emerald-500 mt-2">All clear!</p>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: Live Feed */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" /> Recent Paystack Alerts (Disputes)
            </h2>
            <Link href="/admin/dashboard/disputes" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-slate-100">
            {recentAlerts && recentAlerts.length > 0 ? (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${
                        alert.status === 'open' ? 'bg-red-100 text-red-700' : 
                        alert.status === 'needs_attention' ? 'bg-orange-100 text-orange-700' : 
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {alert.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {/* @ts-ignore */}
                        {alert.stores?.name || "Unknown Store"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Reason: <span className="font-medium text-slate-700">{alert.reason || "Not provided"}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">Ksh {Number(alert.amount).toLocaleString()}</p>
                    <p className="text-xs font-medium text-slate-400 font-mono mt-0.5">{alert.transaction_reference}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No recent alerts</h3>
                <p className="text-slate-500 text-sm mt-1">Your platform is running smoothly.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}