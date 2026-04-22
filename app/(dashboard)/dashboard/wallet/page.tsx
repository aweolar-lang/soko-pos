"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowDownRight, Loader2, Activity, Settings, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

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
    totalEarnings: 0,
    totalOrders: 0
  });

  useEffect(() => {
    async function fetchWalletData() {
      try {
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
            orders.forEach(order => {
              // Assuming 'COMPLETED', 'PAID', or 'NEW' means money was received
              total += Number(order.amount_paid || 0); 
            });

            setMetrics({
              totalEarnings: total,
              totalOrders: orders.length
            });
          }
        }
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      } finally {
        setIsLoading(false);
      }
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
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Wallet & Earnings</h1>
          <p className="mt-2 text-sm text-slate-500">
            Track your automated M-Pesa payouts and sales history.
          </p>
        </div>
        
        <Link 
          href="/dashboard/settings" 
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all"
        >
          <Settings className="h-4 w-4" />
          Payout Settings
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        {/* Total Earnings Card */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl shadow-slate-200 border border-slate-800 relative overflow-hidden sm:col-span-2">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Wallet className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">Total Lifetime Earnings</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
              <span className="text-emerald-400 text-2xl sm:text-3xl mr-1">Ksh</span>
              {metrics.totalEarnings.toLocaleString()}
            </h2>
            
            <div className="flex items-center gap-2 bg-slate-800/50 w-fit px-3 py-1.5 rounded-lg border border-slate-700">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-300">Funds are auto-settled to your M-Pesa</span>
            </div>
          </div>
        </div>

        {/* Orders Count Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">Total Orders</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {metrics.totalOrders}
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">Successful transactions</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900">Recent Transactions</h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${
                    tx.status === 'COMPLETED' || tx.status === 'PAID' || tx.status === 'NEW' 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    {tx.status === 'COMPLETED' || tx.status === 'PAID' || tx.status === 'NEW' 
                      ? <ArrowDownRight className="h-5 w-5" /> 
                      : <Activity className="h-5 w-5" />
                    }
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{tx.customer_name || "Guest Checkout"}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString()} • {tx.fulfillment_type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600">+ Ksh {tx.amount_paid}</p>
                  <p className={`text-xs font-bold mt-1 ${
                    tx.status === 'COMPLETED' || tx.status === 'PAID' || tx.status === 'NEW' 
                      ? 'text-emerald-600' 
                      : 'text-amber-500'
                  }`}>
                    Paid
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Wallet className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p className="font-medium text-slate-900">No transactions yet</p>
              <p className="text-sm mt-1">When customers buy your products, they will appear here.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}