"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowDownRight, Loader2, Settings,Activity, ArrowUpRight, CheckCircle2, Clock, Store, FileText, Calendar, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  type: 'ORDER' | 'PAYOUT';
  status: string;
  title: string;
  subtitle: string;
  isPOS: boolean;
}

export default function WalletPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Date picker states for PDF
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [metrics, setMetrics] = useState({
    onlineEarnings: 0,
    posEarnings: 0,
    totalSettled: 0,
    pendingBalance: 0,
    todayPOS: 0,
    todayOnline: 0
  });

  const [storeName, setStoreName] = useState("");

  useEffect(() => {
    async function fetchWalletData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: store } = await supabase
          .from('stores')
          .select('id, name')
          .eq('owner_id', user.id)
          .single();

        if (store) {
          const { data: orders } = await supabase
            .from('orders')
            .select('id, created_at, amount_paid, status, customer_name, fulfillment_type')
            .eq('store_id', store.id);

          const { data: payouts } = await supabase
            .from('payouts')
            .select('id, created_at, amount_paid, status, paystack_reference')
            .eq('store_id', store.id);

          let onlineEarned = 0;
          let posEarned = 0;
          let totalSettled = 0;
          let combinedTransactions: Transaction[] = [];

          if (orders) {
            orders.forEach(order => {
              const amount = Number(order.amount_paid || 0);
              const isPOS = order.fulfillment_type === 'IN_STORE';

              if (isPOS) posEarned += amount;
              else onlineEarned += amount;

              combinedTransactions.push({
                id: order.id,
                created_at: order.created_at,
                amount: amount,
                type: 'ORDER',
                status: order.status,
                title: order.customer_name || "Customer Order",
                subtitle: isPOS ? "In-Store Sale (POS)" : `Online Order (${order.fulfillment_type || "SHIPPING"})`,
                isPOS: isPOS
              });
            });
          }

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
                subtitle: "Auto-Payout via Paystack",
                isPOS: false
              });
            });
          }

          combinedTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

          // Calculate "Today's" Math
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayPOS = combinedTransactions
            .filter(t => t.isPOS && new Date(t.created_at) >= today)
            .reduce((sum, t) => sum + t.amount, 0);
            
          const todayOnline = combinedTransactions
            .filter(t => !t.isPOS && t.type === 'ORDER' && new Date(t.created_at) >= today)
            .reduce((sum, t) => sum + t.amount, 0);

          setTransactions(combinedTransactions);
          setMetrics({
            onlineEarnings: onlineEarned,
            posEarnings: posEarned,
            totalSettled: totalSettled,
            pendingBalance: onlineEarned - totalSettled,
            todayPOS,
            todayOnline
          });
          setStoreName(store.name || "");
        }
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchWalletData();
  }, []);

  const downloadPDF = () => {
    if (!startDate || !endDate) {
      alert("Please select both a Start Date and End Date.");
      return;
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = transactions.filter(t => {
      const txDate = new Date(t.created_at);
      return txDate >= start && txDate <= end;
    });

    if (filtered.length === 0) {
      alert("No transactions found for this period.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); 
    doc.setFont("helvetica", "bold");
    doc.text("LokoSoko POS", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); 
    doc.setFont("helvetica", "normal");
    doc.text("www.lokosoko.com", 14, 28);

    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); 
    doc.setFont("helvetica", "bold");
    doc.text("STORE STATEMENT", pageWidth - 14, 22, { align: "right" });

    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105); 
    doc.setFont("helvetica", "normal");
    doc.text(`Store: ${storeName}`, pageWidth - 14, 30, { align: "right" });
    doc.text(`Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`, pageWidth - 14, 36, { align: "right" });

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); 
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 14, 42, { align: "right" });

    const pOnline = filtered.filter(t => !t.isPOS && t.type === 'ORDER').reduce((sum, t) => sum + t.amount, 0);
    const pPOS = filtered.filter(t => t.isPOS).reduce((sum, t) => sum + t.amount, 0);
    const pSettled = filtered.filter(t => t.type === 'PAYOUT').reduce((sum, t) => sum + t.amount, 0);

    doc.setFillColor(245, 247, 250);
    doc.rect(14, 50, 182, 25, 'F'); 
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(`Online Sales: Ksh ${pOnline.toLocaleString()}`, 20, 60);
    doc.text(`POS Sales: Ksh ${pPOS.toLocaleString()}`, 80, 60);
    doc.text(`Platform Payouts: Ksh ${pSettled.toLocaleString()}`, 140, 60);

    autoTable(doc, {
      startY: 85, 
      head: [['Date', 'Type', 'Description', 'Amount']],
      body: filtered.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.type === 'ORDER' ? (t.isPOS ? 'POS Sale' : 'Online Sale') : 'Payout',
        t.title,
        `Ksh ${t.amount.toLocaleString()}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`Statement_${startDate}_to_${endDate}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-8">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Wallet & Accounting</h1>
          <p className="mt-1 sm:mt-2 text-sm text-slate-500">Track pending payouts and download business statements.</p>
        </div>
        {/* Full width button on mobile, auto width on desktop */}
        <Link href="/dashboard/settings" className="w-full sm:w-auto flex justify-center items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 sm:py-2.5 px-4 rounded-xl transition-all active:scale-[0.98]">
          <Settings className="h-4 w-4" /> Payout Settings
        </Link>
      </div>

      {/* ROW 1: LIFETIME MACRO METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-slate-900 text-white rounded-[1.5rem] p-5 sm:p-6 shadow-lg border border-slate-800">
          <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">Pending Online Payout</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-amber-400">
            <span className="text-amber-200/50 text-xl sm:text-2xl mr-1">Ksh</span>{metrics.pendingBalance.toLocaleString()}
          </h2>
        </div>

        <div className="bg-emerald-50 rounded-[1.5rem] p-5 sm:p-6 border border-emerald-100">
          <p className="text-emerald-600 font-bold text-xs uppercase tracking-wider mb-2">Platform Settled (Lifetime)</p>
          <h2 className="text-3xl sm:text-4xl font-black text-emerald-900 tracking-tight">
            <span className="text-emerald-600/50 text-xl sm:text-2xl mr-1">Ksh</span>{metrics.totalSettled.toLocaleString()}
          </h2>
        </div>

        <div className="bg-blue-50 rounded-[1.5rem] p-5 sm:p-6 border border-blue-100">
          <p className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-2">POS Collected (Lifetime)</p>
          <h2 className="text-3xl sm:text-4xl font-black text-blue-900 tracking-tight">
            <span className="text-blue-600/50 text-xl sm:text-2xl mr-1">Ksh</span>{metrics.posEarnings.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* ROW 2: DAILY SNAPSHOT & STATEMENT GENERATOR */}
      <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
        
        {/* Today's Snapshot */}
        <div className="bg-white rounded-[1.5rem] p-5 sm:p-6 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-5 sm:mb-6 flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-indigo-500" /> Today's Snapshot
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Today's POS Cash</p>
              <p className="text-xl sm:text-2xl font-black text-blue-600 truncate">Ksh {metrics.todayPOS.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Today's Online</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 truncate">Ksh {metrics.todayOnline.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Statement Generator */}
        <div className="bg-white rounded-[1.5rem] p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <h3 className="font-bold text-slate-900 mb-4 sm:mb-5 flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-slate-500" /> Generate Statement (PDF)
          </h3>
          <div className="space-y-4 sm:space-y-5">
            {/* Flex-col on mobile so the date inputs stack, flex-row on desktop */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-sm outline-none focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 sm:py-2 text-base sm:text-sm outline-none focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>
            </div>
            <button 
              onClick={downloadPDF}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 sm:py-3 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-slate-900/10"
            >
              <Download className="h-4 w-4" /> Download PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY (Truncated to 5 items) */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-[1.5rem] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Recent Activity</h3>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Last 5 Transactions</span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {transactions.length > 0 ? (
            transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className={`p-2.5 sm:p-3 rounded-full shrink-0 ${
                    tx.type === 'ORDER' && !tx.isPOS ? 'bg-emerald-100 text-emerald-600' : 
                    tx.type === 'ORDER' && tx.isPOS ? 'bg-blue-100 text-blue-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {tx.type === 'ORDER' ? <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5" /> : <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </div>
                  {/* min-w-0 and truncate ensure long names don't break the flex layout on small screens */}
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{tx.title}</p>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
                      {new Date(tx.created_at).toLocaleDateString()} • {tx.subtitle}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-black text-sm sm:text-base ${
                    tx.type === 'ORDER' && !tx.isPOS ? 'text-emerald-600' : 
                    tx.type === 'ORDER' && tx.isPOS ? 'text-blue-600' :
                    'text-slate-900'
                  }`}>
                    {tx.type === 'ORDER' ? '+' : '-'} Ksh {tx.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] sm:text-xs font-bold mt-1 text-slate-400">
                    {tx.type === 'PAYOUT' ? 'Settled' : tx.isPOS ? 'Collected' : 'Pending'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 sm:p-12 text-center text-slate-500">
              <Wallet className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <p className="font-medium text-slate-900 text-sm sm:text-base">No transactions yet</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}