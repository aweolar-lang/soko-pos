"use client";

import { useEffect, useState } from "react";
import { Package, MapPin, Clock, Phone, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; 

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  amount_paid: number;
  fulfillment_type: string;
  takeaway_time: string;
  customer_notes: string;
  status: string;
  created_at: string;
  currency?: string; // NEW: optional for older orders
  products: {
    title: string; 
  } | null;
}

const STATUS_OPTIONS = [
  { value: 'NEW', label: 'New Order', color: 'bg-blue-100 text-blue-700' },
  { value: 'PREPARING', label: 'Preparing', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup', color: 'bg-orange-100 text-orange-700' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'bg-purple-100 text-purple-700' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  
  // NEW: Store currency
  const [storeCurrency, setStoreCurrency] = useState("KES");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // UPGRADE: Fetch currency alongside the store ID
      const { data: store } = await supabase
        .from('stores')
        .select('id, currency')
        .eq('owner_id', user.id)
        .single();

      if (!store) {
        setIsLoading(false);
        return;
      }
      
      setStoreCurrency(store.currency || "KES");

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          products ( title )
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(ordersData as Order[] || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      toast.success(`Order marked as ${newStatus.replace(/_/g, ' ')}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update order status.");
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Helper to dynamically show currency symbol based on order data or store fallback
  const getCurrencySymbol = (orderCurrency?: string) => {
    const currencyToUse = orderCurrency || storeCurrency;
    return currencyToUse === "USD" ? "$" : "Ksh ";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Orders</h1>
        <p className="mt-1 sm:mt-2 text-sm text-slate-500">
          Manage your incoming orders, deliveries, and pickups.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-[1.5rem] border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No orders yet</h3>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">When customers buy your products, they will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {orders.map((order) => {
            const statusConfig = STATUS_OPTIONS.find(s => s.value === order.status) || STATUS_OPTIONS[0];
            const sym = getCurrencySymbol(order.currency);

            return (
              <div key={order.id} className="bg-white border border-slate-200 rounded-[1.5rem] p-5 sm:p-6 shadow-sm flex flex-col relative overflow-hidden group hover:border-emerald-200 transition-colors">
                
                {/* Header: Date, Title & Adaptive Status Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 border-b border-slate-100 pb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-medium mb-1.5">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      {order.products?.title || "Deleted Product"}
                    </h3>
                  </div>
                  
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={isUpdating === order.id}
                    className={`appearance-none cursor-pointer text-xs sm:text-sm font-bold px-4 py-2.5 sm:py-2 rounded-xl sm:rounded-full outline-none transition-colors border-2 w-full sm:w-auto text-center sm:text-left ${statusConfig.color.replace('bg-', 'border-').split(' ')[0]} ${statusConfig.color}`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-white text-slate-900 font-medium">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3 sm:space-y-4 mb-2 flex-1">
                  
                  {/* Customer & Price */}
                  <div className="flex justify-between items-center bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-700 truncate pr-2">{order.customer_name}</span>
                    {/* UPGRADE: DYNAMIC CURRENCY LOGIC APPLIED */}
                    <span className="text-sm sm:text-base font-black text-emerald-600 shrink-0">{sym}{order.amount_paid.toLocaleString()}</span>
                  </div>

                  {/* Phone Number */}
                  {order.customer_phone && order.customer_phone !== "N/A" && (
                    <div className="flex items-center gap-3 text-sm text-slate-600 px-1">
                      <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                      <a href={`tel:${order.customer_phone}`} className="hover:text-emerald-600 font-medium transition-colors">
                        {order.customer_phone}
                      </a>
                    </div>
                  )}

                  {/* Location / Takeaway Info */}
                  {order.fulfillment_type === 'TAKEAWAY' ? (
                    <div className="flex items-start gap-3 text-sm text-slate-600 bg-orange-50/50 p-3 sm:p-4 rounded-xl border border-orange-100">
                      <Clock className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold text-orange-800 block mb-0.5">Takeaway Pickup</span>
                        <span className="truncate block">{order.takeaway_time ? new Date(order.takeaway_time).toLocaleString() : "As soon as possible"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 text-sm text-slate-600 bg-blue-50/50 p-3 sm:p-4 rounded-xl border border-blue-100">
                      <MapPin className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold text-blue-800 block mb-0.5">Delivery Location</span>
                        <span className="break-words block">{order.customer_notes && order.customer_notes !== "N/A" ? order.customer_notes : "No address provided."}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Notes (Only for takeaway if provided) */}
                  {order.fulfillment_type === 'TAKEAWAY' && order.customer_notes && order.customer_notes !== "N/A" && (
                    <div className="text-sm text-slate-600 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700 text-[10px] sm:text-xs uppercase tracking-wider block mb-1">Customer Notes</span>
                      <span className="break-words block">{order.customer_notes}</span>
                    </div>
                  )}
                </div>

                {/* Loading Overlay */}
                {isUpdating === order.id && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}