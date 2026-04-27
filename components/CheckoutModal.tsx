"use client";

import { useState, useEffect } from "react";
import { Loader2, X, Clock, MapPin, FileDown, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/useCartStore";
import { isValidName, isValidEmail, formatKenyanPhone } from "@/lib/validators";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, storeId, getTotal } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Auto-detect if cart needs physical delivery
  const hasPhysical = items.some((item) => !item.is_digital);
  const cartTotal = getTotal();

  const [formData, setFormData] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    fulfillmentType: hasPhysical ? "DELIVERY" : "DIGITAL",
    takeawayTime: "",
    customerNotes: "",
  });

  const [errors, setErrors] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;

    if (name === "buyerName") {
      if (value.length > 50) value = value.slice(0, 50);
      value = value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }

    if (name === "buyerEmail") {
      if (value.length > 200) value = value.slice(0, 200);
      value = value.toLowerCase().replace(/\s/g, ""); 
    }

    if (name === "customerNotes") {
      if (value.length > 500) value = value.slice(0, 500);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return; 
    
    if (name === "buyerName" && !isValidName(value)) {
      setErrors((prev) => ({ ...prev, buyerName: "Please enter a valid full name." }));
    }
    if (name === "buyerEmail" && !isValidEmail(value)) {
      setErrors((prev) => ({ ...prev, buyerEmail: "Please enter a valid email address." }));
    }
    if (name === "buyerPhone") {
      const formattedPhone = formatKenyanPhone(value);
      if (!formattedPhone) {
        setErrors((prev) => ({ ...prev, buyerPhone: "Invalid phone number." }));
      } else {
        setFormData((prev) => ({ ...prev, buyerPhone: formattedPhone }));
      }
    }
  };

  const isFormValid = 
    formData.buyerName.trim() !== "" &&
    formData.buyerEmail.trim() !== "" &&
    formData.buyerPhone.trim() !== "" &&
    !Object.values(errors).some(error => error !== "");

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalPhone = formatKenyanPhone(formData.buyerPhone);
    if (!finalPhone || !isValidEmail(formData.buyerEmail) || !isValidName(formData.buyerName)) {
      toast.error("Please fix the highlighted errors before checking out.");
      return;
    }

    setIsLoading(true);

    try {
      // THE NEW CART PAYLOAD
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: storeId,
          // Extract just the IDs and Quantities for the secure API
          items: items.map(item => ({ id: item.id, quantity: item.quantity })), 
          buyerName: formData.buyerName,
          buyerEmail: formData.buyerEmail,
          buyerPhone: finalPhone,
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              Secure Checkout
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Total: {cartTotal.toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-6 flex-1">
          <form id="checkout-form" onSubmit={handleCheckout} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" required name="buyerName"
                value={formData.buyerName} onChange={handleInputChange} onBlur={handleBlur}
                className={`w-full px-4 py-3 border rounded-xl outline-none text-sm transition-all ${errors.buyerName ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'}`} 
                placeholder="John Doe"
              />
              {errors.buyerName && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.buyerName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Email (For Receipt)</label>
                <input 
                  type="email" required name="buyerEmail"
                  value={formData.buyerEmail} onChange={handleInputChange} onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-xl outline-none text-sm transition-all ${errors.buyerEmail ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'}`} 
                  placeholder="john@example.com" 
                />
                {errors.buyerEmail && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.buyerEmail}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Phone</label>
                <input 
                  type="tel" required name="buyerPhone"
                  value={formData.buyerPhone} onChange={handleInputChange} onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-xl outline-none text-sm transition-all ${errors.buyerPhone ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'}`} 
                  placeholder="07..." 
                />
                {errors.buyerPhone && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.buyerPhone}</p>}
              </div>
            </div>

            {/* Smart Delivery UI */}
            {!hasPhysical ? (
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 mt-2">
                <FileDown className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-blue-900 text-sm">Instant Digital Delivery</h4>
                  <p className="text-xs text-blue-800/80 mt-1 font-medium">After completing payment, you will receive secure links to download your items.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Fulfillment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button" onClick={() => setFormData({...formData, fulfillmentType: 'PICKUP'})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-colors ${
                        formData.fulfillmentType === 'PICKUP' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Clock className="h-4 w-4" /> Pick Up / Takeaway
                    </button>
                    <button 
                      type="button" onClick={() => setFormData({...formData, fulfillmentType: 'DELIVERY'})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-colors ${
                        formData.fulfillmentType === 'DELIVERY' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <MapPin className="h-4 w-4" /> Delivery
                    </button>
                  </div>
                </div>

                {formData.fulfillmentType === 'PICKUP' && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Estimated Pickup Time</label>
                    <input 
                      type="time" required name="takeawayTime"
                      value={formData.takeawayTime} onChange={handleInputChange}
                      className="text-slate-900 w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white transition-all" 
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    {formData.fulfillmentType === 'DELIVERY' ? "Full Delivery Address" : "Special Instructions"}
                  </label>
                  <textarea 
                    rows={2} required={formData.fulfillmentType === 'DELIVERY'}
                    name="customerNotes"
                    value={formData.customerNotes} onChange={handleInputChange}
                    className="text-slate-900 w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white resize-none transition-all" 
                    placeholder={formData.fulfillmentType === 'PICKUP' ? "e.g. Please wrap it nicely..." : "House number, street, landmarks..."} 
                  />
                </div>
              </>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
          <button 
            type="submit" 
            form="checkout-form"
            disabled={isLoading || !isFormValid}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /><span>Processing Secure Payment...</span></>
            ) : (
              <span>Proceed to Payment</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}