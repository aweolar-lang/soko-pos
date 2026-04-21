"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useUser";
import { Receipt, Search, Clock, CheckCircle, CreditCard, Banknote, TrendingUp, PackageOpen } from "lucide-react";

// Types for our orders
interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  is_pos_sale: boolean;
  created_at: string;
}

export default function OrdersPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Quick Stats
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const totalOrders = orders.length;

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;
      
      // 1. Get the store
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (store) {
        // 2. Get the orders
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('store_id', store.id)
          .order('created_at', { ascending: false });
          
        if (orderData) setOrders(orderData);
      }
      setIsLoading(false);
    }
    fetchOrders();
  }, [user]);

  // UI Helpers
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle className="h-3.5 w-3.5" /> Paid</span>;
      case 'pending':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700"><Clock className="h-3.5 w-3.5" /> Pending</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders & Sales</h1>
          <p className="text-slate-500 text-sm mt-1">Track your POS walk-ins and online storefront sales.</p>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <TrendingUp className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Total Revenue</p>
            <p className="text-2xl font-black text-slate-900">Ksh {totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Receipt className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Total Orders</p>
            <p className="text-2xl font-black text-slate-900">{totalOrders}</p>
          </div>
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <PackageOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No sales yet</p>
                    <p className="text-slate-400 text-sm mt-1">When customers buy from you, orders appear here.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Order ID */}
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">
                      #{order.id.split('-')[0].toUpperCase()}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(order.created_at).toLocaleDateString('en-KE', { 
                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>

                    {/* Source (POS vs Online) */}
                    <td className="px-6 py-4">
                      {order.is_pos_sale ? (
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Banknote className="h-4 w-4 text-slate-400" /> Walk-in POS
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                          <CreditCard className="h-4 w-4 text-blue-400" /> Online Store
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 font-black text-emerald-600 text-right">
                      Ksh {Number(order.total_amount).toLocaleString()}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}