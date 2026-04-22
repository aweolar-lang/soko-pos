"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowDownRight, Loader2, Activity, Settings, ShieldCheck, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  type: 'ORDER' | 'PAYOUT';
  status: string;
  title: string;
  subtitle: string;
}

export default function WalletPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [metrics, setMetrics] = useState({
    totalEarnings: 0,
    totalSettled: 0,
    pendingBalance: 0
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
          // 1. Fetch Orders (Money In)
          const { data: orders } = await supabase
            .from('orders')
            .select('id, created_at, amount_paid, status, customer_name, fulfillment_type')
            .eq('store_id', store.id);

          // 2. Fetch Payouts (Money Out)
          const { data: payouts } = await supabase
            .from('payouts')
            .select('id, created_at, amount_paid, status, paystack_reference')
            .eq('store_id', store.id);

          let totalEarned = 0;
          let totalSettled = 0;
          let combinedTransactions: Transaction[] = [];

          // Process Orders
          if (orders) {
            orders.forEach(order => {
              totalEarned += Number(order.amount_paid || 0);
              combinedTransactions.push({
                id: order.id,
                created_at: order.created_at,
                amount: Number(order.amount_paid),
                type: 'ORDER',
                status: order.status,
                title: order.customer_name || "Customer Order",
                subtitle: order.fulfillment_type
              });
            });
          }

          // Process Payouts
          if (payouts) {
            payouts.forEach(payout => {
              totalSettled += Number(payout.amount_paid || 0);
              combinedTransactions.push({
                id: payout.id,
                created_at: payout.created_at,
                amount: Number(payout.amount_paid),
                type: 'PAYOUT',
                status: payout.status,
                title: "M-Pesa Settlement",
                subtitle: "Auto-Payout via Paystack"
              });
            });
          }

          // Sort transactions by date (newest first)
          combinedTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          setTransactions(combinedTransactions);
          setMetrics({
            totalEarnings: totalEarned,
            totalSettled: totalSettled,
            pendingBalance: totalEarned - totalSettled // THE MAGIC MATH
          });
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
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Wallet</h1>
          <p className="mt-2 text-sm text-slate-500">Track your pending balance and successful M-Pesa payouts.</p>
        </div>
        <Link href="/dashboard/settings" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all">
          <Settings className="h-4 w-4" />
          Payout Settings
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        
        {/* PENDING BALANCE (Money waiting to be paid) */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl shadow-slate-200 border border-slate-800 relative overflow-hidden sm:col-span-2">
          <div className="absolute top-0 right-0 p-6 opacity-10"><Wallet className="h-24 w-24" /></div>
          <div className="relative z-10">
            <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">Pending Settlement</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6 text-amber-400">
              <span className="text-amber-200/50 text-2xl sm:text-3xl mr-1">Ksh</span>
              {metrics.pendingBalance.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 bg-slate-800/50 w-fit px-3 py-1.5 rounded-lg border border-slate-700">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-slate-300">Processing to M-Pesa</span>
            </div>
          </div>
        </div>

        {/* TOTAL SETTLED (Money successfully sent to M-Pesa) */}
        <div className="bg-emerald-50 rounded-3xl p-6 shadow-sm border border-emerald-100 flex flex-col justify-center">
          <p className="text-emerald-600 font-bold text-sm uppercase tracking-wider mb-2">Successfully Paid</p>
          <h2 className="text-3xl font-black text-emerald-900 tracking-tight">
            Ksh {metrics.totalSettled.toLocaleString()}
          </h2>
          <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Settled to M-Pesa
          </p>
        </div>
      </div>

      {/* Unified Transaction History (Orders + Payouts) */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900">History (Sales & Payouts)</h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Icon logic: Down Arrow for Orders (Money in), Up Arrow for Payouts (Money Out) */}
                  <div className={`p-3 rounded-full ${
                    tx.type === 'ORDER' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tx.type === 'ORDER' ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{tx.title}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString()} • {tx.subtitle}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {/* Amount logic: Green for Sales, Gray/Negative for Payouts */}
                  <p className={`font-black ${tx.type === 'ORDER' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {tx.type === 'ORDER' ? '+' : '-'} Ksh {tx.amount.toLocaleString()}
                  </p>
                  <p className="text-xs font-bold mt-1 text-slate-400">
                    {tx.type === 'PAYOUT' ? 'Settled' : 'Cleared'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Wallet className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p className="font-medium text-slate-900">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}