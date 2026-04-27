"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/useCartStore";
import { usePathname } from "next/navigation";
import CheckoutModal from "./CheckoutModal";

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  
  // Pull what we need from our Zustand store
  const { items, _hasHydrated, updateQuantity, removeItem, getTotal, getItemCount } = useCartStore();

  // PRODUCTION UPGRADE: Automatically close the drawer if they navigate to another page
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // PRODUCTION UPGRADE: Prevent Next.js Hydration errors by not rendering until localStorage loads
  if (!_hasHydrated) return null;

  const itemCount = getItemCount();
  const cartTotal = getTotal();

  return (
    <>
      {/* 1. THE FLOATING CART BUTTON */}
      {itemCount > 0 && (
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2 text-slate-700 hover:bg-slate-100 hover:text-emerald-600 rounded-full transition-colors flex items-center justify-center"
          >
            <ShoppingBag className="h-6 w-6" />
            
            {/* Only show the notification badge if there are items in the cart */}
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {itemCount}
              </span>
            )}
          </button>
      )}

      {/* 2. THE BACKGROUND OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 3. THE SLIDING DRAWER */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-[101] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
              <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-slate-300" />
              </div>
              <p className="font-medium text-slate-500">Your cart is empty</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-emerald-600 font-bold text-sm hover:underline"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 bg-white">
                {/* Item Image */}
                <div className="h-20 w-20 shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-300">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm line-clamp-2">{item.title}</h3>
                    <p className="text-slate-500 font-bold text-sm mt-1">
                      {item.price.toLocaleString()}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="p-1 hover:bg-white rounded text-slate-600 disabled:opacity-50 transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= 99}
                        className="p-1 hover:bg-white rounded text-slate-600 disabled:opacity-50 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        
        {items.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-500 font-bold">Subtotal</span>
              <span className="text-xl font-black text-slate-900">{cartTotal.toLocaleString()}</span>
            </div>
            
            <button 
              onClick={() => setIsCheckoutModalOpen(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              Proceed to Payment
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <CheckoutModal 
        isOpen={isCheckoutModalOpen} 
        onClose={() => setIsCheckoutModalOpen(false)} 
      />
    </>
  );
}