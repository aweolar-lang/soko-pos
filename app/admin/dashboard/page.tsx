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
import RevenueChart from "../components/RevenueChart";

// 1. Secure Server-Side Supabase Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0; // Always fetch fresh data on load

export default async function AdminDashboard() {
  // 2. Fetch all our metrics in parallel for maximum speed
  // UPGRADE: Added 'created_at' to the transactions query so we can plot them on the chart!
  const [
    { data: transactions },
    { count: openDisputes },
    { count: pendingRefunds },
    { count: totalStores },
    { count: totalOrders },
    { data: recentAlerts }
  ] = await Promise.all([
    // Total volume (Successful payments)
    supabaseAdmin.from('transactions').select('amount, created_at').eq('status', 'success').eq('type', 'payment'),
    // Active disputes
    supabaseAdmin.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'needs_attention']),
    // Pending refunds
    supabaseAdmin.from('refunds').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
    // Total stores
    supabaseAdmin.from('stores').select('*', { count: 'exact', head: true }),
    // Total orders
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    // Recent Alerts (Disputes that need attention)
    supabaseAdmin.from('disputes').select('*, stores(name)').order('created_at', { ascending: false }).limit(5)
  ]);

  // ==========================================
  // 3. CHART DATA PROCESSING
  // ==========================================
  
  // Create a template for the last 7 days (e.g., ["Mon", "Tue", "Wed"...])
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { weekday: 'short' }); 
  });

  // Initialize all 7 days with 0 revenue
  const chartDataMap = last7Days.reduce((acc, day) => {
    acc[day] = 0;
    return acc;
  }, {} as Record<string, number>);

  let totalVolume = 0;

  // Process transactions: Add to total volume AND map to specific days
  if (transactions) {
    // Only look at transactions from the last 7 days for the chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    transactions.forEach(tx => {
      const txAmount = Number(tx.amount || 0);
      totalVolume += txAmount; // Add to global total

      const txDateObj = new Date(tx.created_at);
      if (txDateObj >= sevenDaysAgo) {
        const dayString = txDateObj.toLocaleDateString('en-US', { weekday: 'short' });
        if (chartDataMap[dayString] !== undefined) {
          chartDataMap[dayString] += txAmount;
        }
      }
    });
  }

  // Format array exactly how RevenueChart.tsx expects it: [{ date: "Mon", amount: 1500 }]
  const formattedChartData = last7Days.map(day => ({
    date: day,
    amount: chartDataMap[day]
  }));

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Overview</h1>
        <p className="text-slate-500 font-medium mt-1">Real-time metrics and system alerts.</p>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500">Total Volume</h3>
            <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">Ksh {totalVolume.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500">Active Stores</h3>
            <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center">
              <Store className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalStores || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500">Total Orders</h3>
            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalOrders || 0}</p>
        </div>

        {/* ACTION ITEMS (Disputes & Refunds) */}
        <div className="flex flex-col gap-4">
          <Link href="/admin/dashboard/disputes" className="flex-1 bg-red-50 hover:bg-red-100 transition-colors p-4 rounded-2xl border border-red-100 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-bold text-red-900">Disputes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-red-700">{openDisputes || 0}</span>
              <ArrowRight className="h-4 w-4 text-red-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/admin/dashboard/refunds" className="flex-1 bg-orange-50 hover:bg-orange-100 transition-colors p-4 rounded-2xl border border-orange-100 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <RefreshCcw className="h-5 w-5 text-orange-600" />
              <span className="font-bold text-orange-900">Refunds</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-orange-700">{pendingRefunds || 0}</span>
              <ArrowRight className="h-4 w-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* CHARTS & ALERTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* REVENUE CHART */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-black text-slate-900">Platform Revenue (7 Days)</h2>
            <Activity className="h-5 w-5 text-slate-400" />
          </div>
          <RevenueChart data={formattedChartData} />
        </div>

        {/* RECENT ALERTS */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-900">System Alerts</h2>
            <ShieldCheck className="h-5 w-5 text-slate-400" />
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto">
            {recentAlerts && recentAlerts.length > 0 ? (
              recentAlerts.map((alert: any) => (
                <div key={alert.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${
                        alert.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {alert.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {alert.stores?.name || "Unknown Store"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Reason: <span className="font-medium text-slate-700">{alert.reason || "Not provided"}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900">Ksh {Number(alert.amount || 0).toLocaleString()}</p>
                    <p className="text-xs font-medium text-slate-400 font-mono mt-0.5">{alert.transaction_reference}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center flex flex-col items-center h-full justify-center">
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