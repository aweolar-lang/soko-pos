"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, Loader2, Activity, CreditCard, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  created_at: string;
  amount_paid: number;
  status: string;
  customer_name: string;
  fulfillment_type: string;
}

export default function WalletPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [metrics, setMetrics] = useState({
    totalBalance: 0,
    pendingBalance: 0,
    totalOrders: 0
  });

  useEffect(() => {
    async function fetchWalletData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();

      if (store) {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, created_at, amount_paid, status, customer_name, fulfillment_type')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false });

        if (orders) {
          setTransactions(orders);
          
          // Calculate Metrics
          let total = 0;
          let pending = 0;

          orders.forEach(order => {
            if (order.status === 'COMPLETED') {
              total += Number(order.amount_paid || 0);
            } else if (order.status !== 'CANCELLED') {
              pending += Number(order.amount_paid || 0);
            }
          });

          setMetrics({
            totalBalance: total,
            pendingBalance: pending,
            totalOrders: orders.length
          });
        }
      }
      setIsLoading(false);
    }

    fetchWalletData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Wallet & Payouts</h1>
        <p className="mt-1 text-sm text-slate-500">Track your earnings and manage your store's finances.</p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Wallet className="h-24 w-24" />
          </div>
          <p className="text-slate-400 font-medium text-sm mb-2">Available for Payout</p>
          <h2 className="text-4xl font-black mb-6">Ksh {metrics.totalBalance.toLocaleString()}</h2>
          <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2.5 px-5 rounded-xl text-sm transition-colors flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" /> Withdraw Funds
          </button>
        </div>

        {/* Pending Funds */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
              <Activity className="h-5 w-5" />
            </div>
            <p className="text-slate-500 font-medium text-sm">Pending Clearance</p>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">Ksh {metrics.pendingBalance.toLocaleString()}</h3>
          <p className="text-xs text-slate-400 mt-2">From uncompleted orders</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <p className="text-slate-500 font-medium text-sm">Lifetime Orders</p>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{metrics.totalOrders}</h3>
          <p className="text-xs text-slate-400 mt-2">Total successful transactions</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-lg">Recent Transactions</h3>
          <button className="text-sm font-bold text-slate-600 hover:text-slate-900 flex items-center gap-2 transition-colors">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${
                    tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {tx.status === 'COMPLETED' ? <ArrowDownRight className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{tx.customer_name || "Guest Checkout"}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString()} • {tx.fulfillment_type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">Ksh {tx.amount_paid}</p>
                  <p className={`text-xs font-bold mt-1 ${
                    tx.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-500'
                  }`}>
                    {tx.status}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Wallet className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p className="font-medium text-slate-900">No transactions yet</p>
              <p className="text-sm">Your earnings will appear here once you start making sales.</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}