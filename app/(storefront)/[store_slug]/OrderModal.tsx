"use client";

import { useState } from "react";
import { Loader2, ShoppingCart, X, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string; // FIXED: Changed from name to title
  price: number;
}

interface OrderModalProps {
  product: Product;
  storeId: string;
  isHotel: boolean;
}

export default function OrderModal({ product, storeId, isHotel }: OrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    fulfillmentType: isHotel ? "DELIVERY" : "SHIPPING",
    takeawayTime: "",
    customerNotes: "",
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          buyerName: formData.buyerName,
          buyerEmail: formData.buyerEmail,
          buyerPhone: formData.buyerPhone,
          fulfillmentType: formData.fulfillmentType,
          takeawayTime: formData.takeawayTime,
          customerNotes: formData.customerNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to process order");

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error: any) {
      toast.error(error.message || "Could not start checkout. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors active:scale-95 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
      >
        <ShoppingCart className="h-5 w-5" />
        Order Now
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Complete Order</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-900 shadow-sm transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">{product.title}</span>
                <span className="font-black text-emerald-600">Ksh {product.price.toLocaleString()}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCheckout} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" required value={formData.buyerName} onChange={(e) => setFormData({...formData, buyerName: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white" 
                  placeholder="John Doe" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
                  <input 
                    type="email" required value={formData.buyerEmail} onChange={(e) => setFormData({...formData, buyerEmail: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white" 
                    placeholder="john@example.com" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Phone</label>
                  <input 
                    type="tel" required value={formData.buyerPhone} onChange={(e) => setFormData({...formData, buyerPhone: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white" 
                    placeholder="07..." 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Order Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" onClick={() => setFormData({...formData, fulfillmentType: isHotel ? 'TAKEAWAY' : 'PICKUP'})}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                      formData.fulfillmentType === 'TAKEAWAY' || formData.fulfillmentType === 'PICKUP' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="h-4 w-4" /> {isHotel ? "Takeaway" : "Pick Up"}
                  </button>
                  <button 
                    type="button" onClick={() => setFormData({...formData, fulfillmentType: isHotel ? 'DELIVERY' : 'SHIPPING'})}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                      formData.fulfillmentType === 'DELIVERY' || formData.fulfillmentType === 'SHIPPING' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="h-4 w-4" /> {isHotel ? "Delivery" : "Shipping"}
                  </button>
                </div>
              </div>

              {formData.fulfillmentType === 'TAKEAWAY' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Pickup Time</label>
                  <input 
                    type="time" required value={formData.takeawayTime} onChange={(e) => setFormData({...formData, takeawayTime: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white" 
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  {formData.fulfillmentType === 'DELIVERY' || formData.fulfillmentType === 'SHIPPING' ? "Delivery Address & Notes" : "Special Instructions"}
                </label>
                <textarea 
                  rows={2} required={formData.fulfillmentType === 'DELIVERY' || formData.fulfillmentType === 'SHIPPING'}
                  value={formData.customerNotes} onChange={(e) => setFormData({...formData, customerNotes: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white resize-none" 
                  placeholder={formData.fulfillmentType === 'TAKEAWAY' ? "Any dietary requirements?" : "Enter full delivery address..."} 
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /><span>Processing...</span></>
                  ) : (
                    <span>Proceed to Payment</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}