"use client";

import { useState } from "react";
import { Loader2, ShoppingCart, X, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
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

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize checkout.");
      }

      // Redirect user to Paystack's secure checkout page
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error: any) {
      toast.error(error.message);
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 shadow-md"
      >
        <ShoppingCart className="h-4 w-4" />
        Order Now
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-0">
          
          {/* Modal Content */}
          <div 
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{product.name}</h3>
                <p className="text-emerald-600 font-black">Ksh {product.price}</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCheckout} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Buyer Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                  <input 
                    type="text" required 
                    value={formData.buyerName} onChange={(e) => setFormData({...formData, buyerName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white" 
                    placeholder="John Doe" 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" required 
                    value={formData.buyerEmail} onChange={(e) => setFormData({...formData, buyerEmail: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white" 
                    placeholder="john@example.com" 
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                  <input 
                    type="tel" required 
                    value={formData.buyerPhone} onChange={(e) => setFormData({...formData, buyerPhone: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white" 
                    placeholder="07XX XXX XXX" 
                  />
                </div>
              </div>

              {/* Dynamic Fulfillment Options */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  {isHotel ? "Order Preference" : "Delivery Method"}
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  {isHotel ? (
                    <>
                      <label className={`cursor-pointer border rounded-xl p-3 flex items-center gap-2 transition-all ${formData.fulfillmentType === 'DELIVERY' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        <input type="radio" name="fulfillment" value="DELIVERY" checked={formData.fulfillmentType === 'DELIVERY'} onChange={(e) => setFormData({...formData, fulfillmentType: e.target.value})} className="hidden" />
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-bold">Delivery</span>
                      </label>
                      <label className={`cursor-pointer border rounded-xl p-3 flex items-center gap-2 transition-all ${formData.fulfillmentType === 'TAKEAWAY' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                        <input type="radio" name="fulfillment" value="TAKEAWAY" checked={formData.fulfillmentType === 'TAKEAWAY'} onChange={(e) => setFormData({...formData, fulfillmentType: e.target.value})} className="hidden" />
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-bold">Takeaway</span>
                      </label>
                    </>
                  ) : (
                    <div className="col-span-2 border border-emerald-500 bg-emerald-50 text-emerald-700 rounded-xl p-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-bold">Standard Shipping</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Conditional Takeaway Time Input */}
              {isHotel && formData.fulfillmentType === "TAKEAWAY" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Pickup Time</label>
                  <input 
                    type="datetime-local" required 
                    value={formData.takeawayTime} onChange={(e) => setFormData({...formData, takeawayTime: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white" 
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  {formData.fulfillmentType === 'DELIVERY' || formData.fulfillmentType === 'SHIPPING' ? "Delivery Address & Notes" : "Special Instructions"}
                </label>
                <textarea 
                  rows={2} required={formData.fulfillmentType !== 'TAKEAWAY'}
                  value={formData.customerNotes} onChange={(e) => setFormData({...formData, customerNotes: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white resize-none" 
                  placeholder={formData.fulfillmentType === 'TAKEAWAY' ? "Any dietary requirements?" : "Enter full delivery address..."} 
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </>
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