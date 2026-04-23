"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, ShoppingBag } from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import Image from "next/image";
import { toast } from "sonner";

// TypeScript Interfaces
interface Product {
  id: string;
  title: string;
  price: number;
  stock_quantity: number;
  images: string[];
}

interface CartItem extends Product {
  cartQuantity: number;
}

export default function PointOfSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInventory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (store) {
        setStoreId(store.id); 
        
        const { data: items } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', store.id)
          .gt('stock_quantity', 0); 
        
        if (items) setProducts(items);
      }
      setIsLoading(false);
    }
    
    fetchInventory();
  }, []);

  // 2. Cart Logic
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // Don't let them add more than what's in stock
        if (existing.cartQuantity >= product.stock_quantity) {
          toast.error("Not enough stock!");
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => prev.map(item => {
      if (item.id === productId) {
        const newQ = item.cartQuantity + delta;
        if (newQ > item.stock_quantity) {
          toast.error("Stock limit reached!");
          return item;
        }
        return newQ > 0 ? { ...item, cartQuantity: newQ } : item;
      }
      return item;
    }));
  };

  // 3. Math Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  const tax = subtotal * 0.16; // 16% VAT Example
  const total = subtotal + tax;

  const handleCheckout = async (method: 'Cash' | 'M-Pesa') => {
  if (cart.length === 0) return toast.error("Cart is empty");
  if (!storeId) return toast.error("Store configuration missing");
  
  setIsLoading(true);
  const toastId = toast.loading(`Processing ${method} payment...`);

  try {
    const posReference = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 1. Log the Order
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        paystack_reference: posReference,
        customer_name: `In-Store Customer (${method})`,
        customer_email: "pos@in-store.local",
        amount_paid: total,
        total_amount: total,
        fulfillment_type: 'IN_STORE',
        status: 'COMPLETED',
        product_id: cart[0].id 
      });

    if (orderError) throw orderError;

    // 2. Critical Fix: Deduct Stock for every item in cart
    for (const item of cart) {
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        row_id: item.id,
        quantity: item.cartQuantity
      });

      if (stockError) {
        console.error(`Failed to update stock for ${item.title}:`, stockError);
        // We continue anyway so the sale isn't lost, but log it for the dev
      }
    }

    toast.success("Order logged & inventory updated!", { id: toastId });
    setCart([]); 
    
    // Refresh local product list to show new stock levels
    const { data: updatedItems } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .gt('stock_quantity', 0);
    if (updatedItems) setProducts(updatedItems);

  } catch (error: any) {
    console.error("POS Checkout Error:", error);
    toast.error("Failed to log order.", { id: toastId });
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      
      {/* LEFT PANEL: PRODUCT GRID */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search inventory by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* The Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
             <div className="flex justify-center items-center h-full text-slate-400">Loading POS...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {products
                .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex flex-col items-start p-3 bg-white border border-slate-100 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-full aspect-square bg-slate-100 rounded-lg mb-3 overflow-hidden relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="text-slate-300" /></div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{product.title}</h3>
                  <p className="text-emerald-600 font-black text-sm mt-1">Ksh {product.price.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-1">{product.stock_quantity} in stock</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: THE REGISTER / CART */}
      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-100 bg-slate-900 text-white rounded-t-2xl">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
            Current Order
          </h2>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingBag className="h-10 w-10 opacity-20" />
              <p className="text-sm">Tap items to add to order</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-slate-800 truncate">{item.title}</h4>
                  <p className="text-xs text-slate-500">Ksh {item.price.toLocaleString()}</p>
                </div>
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded text-slate-600"><Minus className="h-4 w-4" /></button>
                  <span className="font-bold text-sm w-4 text-center">{item.cartQuantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded text-slate-600"><Plus className="h-4 w-4" /></button>
                </div>
                
                <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>Ksh {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tax (16%)</span>
              <span>Ksh {tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>Ksh {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleCheckout('Cash')}
              className="flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors active:scale-95"
            >
              <Banknote className="h-5 w-5 text-emerald-400" />
              Cash
            </button>
            <button 
              onClick={() => handleCheckout('M-Pesa')}
              className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors active:scale-95"
            >
              <CreditCard className="h-5 w-5" />
              M-Pesa
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}