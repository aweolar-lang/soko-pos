"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, ShoppingCart, X, Clock, MapPin, ShoppingBag, Info, FileDown } from "lucide-react";
import { toast } from "sonner";
import { isValidName, isValidEmail, formatKenyanPhone } from "@/lib/validators"; // Import your validators

interface Product {
  id: string;
  title: string;
  price: number;
  description?: string;
  images?: string[];
  is_digital?: boolean;
}

interface OrderModalProps {
  product: Product;
  storeId: string;
  isHotel: boolean;
  storeCurrency?: string;
}

export default function OrderModal({ product, storeId, isHotel, storeCurrency = "KES" }: OrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Dynamic currency logic
  const currencySymbol = storeCurrency === "USD" ? "$" : "Ksh ";

  // Form State
  const [formData, setFormData] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    fulfillmentType: product.is_digital ? "DIGITAL" : (isHotel ? "DELIVERY" : "SHIPPING"),
    takeawayTime: "",
    customerNotes: "",
  });

  // NEW: Error State for Validation
  const [errors, setErrors] = useState({
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Input Changes & Clear Errors
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    let value = e.target.value;

    value = value
    .toLowerCase() 
    .replace(/\b\w/g, (char) => char.toUpperCase());

    const MAX_CHARS = 20;
    const processedValue = value.length > MAX_CHARS ? value.slice(0, MAX_CHARS) : value;
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    
    // Clear error immediately when user starts typing to fix it
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate Fields on Blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!value) return; 
    
    // Buyer Name Validation
    if (name === "buyerName" && !isValidName(value)) {
      setErrors((prev) => ({ ...prev, buyerName: "Please enter a valid full name (letters only)." }));
    }

    // Email Validation
    if (name === "buyerEmail" && !isValidEmail(value)) {
      setErrors((prev) => ({ ...prev, buyerEmail: "Please enter a valid email address." }));
    }

    // Phone Validation (Using the Kenyan Phone Formatter)
    if (name === "buyerPhone") {
      const formattedPhone = formatKenyanPhone(value);
      if (!formattedPhone) {
        setErrors((prev) => ({ ...prev, buyerPhone: "Invalid phone number. Start with 07, 01, or 254." }));
      } else {
        // Auto-format the phone number in the UI so the user sees it looks correct
        setFormData((prev) => ({ ...prev, buyerPhone: formattedPhone }));
      }
    }
  };

  // Validity Check
  const isFormValid = 
    formData.buyerName.trim() !== "" &&
    formData.buyerEmail.trim() !== "" &&
    formData.buyerPhone.trim() !== "" &&
    !Object.values(errors).some(error => error !== "");

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final safety check
    const finalPhone = formatKenyanPhone(formData.buyerPhone);
    if (!finalPhone || !isValidEmail(formData.buyerEmail) || !isValidName(formData.buyerName)) {
      toast.error("Please fix the highlighted errors before checking out.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          buyerName: formData.buyerName,
          buyerEmail: formData.buyerEmail,
          buyerPhone: finalPhone, // Always send the sanitized 254... format to the API
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

  const displayImage = product.images && product.images.length > 0 ? product.images[0] : null;

  const ModalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200 relative">
        
        <button onClick={() => setIsOpen(false)} className="md:hidden absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur rounded-full text-slate-900 shadow-sm">
          <X className="h-5 w-5" />
        </button>

        {/* LEFT COLUMN: Product Details */}
        <div className="w-full md:w-1/2 bg-slate-50 flex flex-col overflow-y-auto border-r border-slate-100">
          <div className="relative h-64 md:h-80 w-full shrink-0 bg-slate-100">
            {displayImage ? (
              <img src={displayImage} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                <ShoppingBag className="h-16 w-16 mb-2" />
                <span className="text-sm font-medium">No image available</span>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md text-slate-900 font-black px-4 py-2 rounded-full shadow-lg text-lg">
              {currencySymbol}{product.price.toLocaleString()}
            </div>
          </div>
          
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-4">{product.title}</h2>
            <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              {product.is_digital ? (
                <FileDown className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              ) : (
                <Info className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {product.description || "No specific details provided for this item."}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Checkout Form */}
        <div className="w-full md:w-1/2 flex flex-col h-full max-h-[50vh] md:max-h-none">
          <div className="hidden md:flex bg-white px-6 py-4 border-b border-slate-100 items-center justify-between shrink-0">
            <h3 className="font-bold text-slate-900">Checkout</h3>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleCheckout} className="p-6 space-y-5 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" required name="buyerName"
                value={formData.buyerName} 
                onChange={handleInputChange} 
                onBlur={handleBlur}
                className={`w-full px-4 py-3 border rounded-xl outline-none text-sm transition-all ${errors.buyerName ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900' : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'}`} 
                placeholder="John Doe"
              />
              {errors.buyerName && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.buyerName}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Email (Required for Receipt)</label>
                <input 
                  type="email" required name="buyerEmail"
                  value={formData.buyerEmail} 
                  onChange={handleInputChange} 
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-xl outline-none text-sm transition-all ${errors.buyerEmail ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900' : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'}`} 
                  placeholder="john@example.com" 
                />
                {errors.buyerEmail && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.buyerEmail}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Phone</label>
                <input 
                  type="tel" required name="buyerPhone"
                  value={formData.buyerPhone} 
                  onChange={handleInputChange} 
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-xl outline-none text-sm transition-all ${errors.buyerPhone ? 'border-red-500 bg-red-50 focus:ring-red-500 text-red-900' : 'border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500'}`} 
                  placeholder="07..." 
                />
                {errors.buyerPhone && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.buyerPhone}</p>}
              </div>
            </div>

            {/* CONDITIONAL UI: Hide physical delivery fields if it's a digital product */}
            {product.is_digital ? (
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 mt-2">
                <FileDown className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-blue-900 text-sm">Instant Digital Delivery</h4>
                  <p className="text-xs text-blue-800/80 mt-1 font-medium">After completing payment, you will receive a secure link to download this product.</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                    {isHotel ? "Order Method" : "Delivery Method"}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button" onClick={() => setFormData({...formData, fulfillmentType: isHotel ? 'TAKEAWAY' : 'PICKUP'})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-colors ${
                        formData.fulfillmentType === 'TAKEAWAY' || formData.fulfillmentType === 'PICKUP' 
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Clock className="h-4 w-4" /> {isHotel ? "Takeaway" : "Pick Up"}
                    </button>
                    <button 
                      type="button" onClick={() => setFormData({...formData, fulfillmentType: isHotel ? 'DELIVERY' : 'SHIPPING'})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-colors ${
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
                  <div className="animate-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Pickup Time</label>
                    <input 
                      type="time" required name="takeawayTime"
                      value={formData.takeawayTime} 
                      onChange={handleInputChange}
                      className="text-slate-900 w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white transition-all" 
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    {formData.fulfillmentType === 'DELIVERY' || formData.fulfillmentType === 'SHIPPING' ? "Full Delivery Address" : "Special Instructions"}
                  </label>
                  <textarea 
                    rows={2} required={formData.fulfillmentType === 'DELIVERY' || formData.fulfillmentType === 'SHIPPING'}
                    name="customerNotes"
                    value={formData.customerNotes} 
                    onChange={handleInputChange}
                    className="text-slate-900 w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-slate-50 focus:bg-white resize-none transition-all" 
                    placeholder={formData.fulfillmentType === 'TAKEAWAY' ? "e.g. No onions, extra sauce..." : "House number, street, landmarks..."} 
                  />
                </div>
              </>
            )}

            <div className="pt-4 shrink-0 mt-auto">
              <button 
                type="submit" 
                disabled={isLoading || !isFormValid}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /><span>Processing Secure Payment...</span></>
                ) : (
                  <span>{product.is_digital ? "Buy & Download" : (isHotel ? "Complete Order" : "Proceed to Payment")}</span>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`w-full py-3 rounded-xl text-white font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 ${
          product.is_digital ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
        }`}
      >
        {product.is_digital ? <FileDown className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
        {product.is_digital ? "Buy & Download" : (isHotel ? "Order Food" : "Buy Now")}
      </button>

      {mounted && isOpen && createPortal(ModalContent, document.body)}
    </>
  );
}