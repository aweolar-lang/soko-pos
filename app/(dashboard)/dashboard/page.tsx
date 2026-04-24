"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, ShoppingBag, CheckCircle2, Printer, Download, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import { toast } from "sonner";
import html2canvas from "html2canvas"; // Ensure you ran: npm install html2canvas

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
  
  // Track the store's currency & name
  const [storeCurrency, setStoreCurrency] = useState("KES");
  const [storeName, setStoreName] = useState("LocalSoko Merchant");

  // NEW: Receipt State & Refs
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const printReceiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchInventory() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      // Fetch the currency & name column
      const { data: store } = await supabase
        .from('stores')
        .select('id, currency, name')
        .eq('owner_id', user.id)
        .single();

      if (store) {
        setStoreId(store.id); 
        setStoreCurrency(store.currency || "KES");
        if (store.name) setStoreName(store.name);

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

  const addToCart = (product: Product) => {
    // UPGRADE: Auto-reset the success screen if they tap a new item
    if (completedOrder) {
      setCompletedOrder(null);
      setCart([{ ...product, cartQuantity: 1 }]);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
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

  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((item) => item.id !== productId));

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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);
  const tax = subtotal * 0.02; 
  const total = subtotal + tax;

  // Helper to dynamically show currency symbol
  const sym = storeCurrency === "USD" ? "$" : "Ksh ";

  const handleCheckout = async (method: 'Cash' | 'M-Pesa') => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!storeId) return toast.error("Store configuration missing");
    
    setIsLoading(true);
    const toastId = toast.loading(`Processing ${method} payment...`);

    try {
      const posReference = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
          product_id: cart[0].id,
          currency: storeCurrency 
        });

      if (orderError) throw orderError;

      for (const item of cart) {
        await supabase.rpc('decrement_stock', { row_id: item.id, quantity: item.cartQuantity });
      }

      toast.success("Order logged & inventory updated!", { id: toastId });
      
      // UPGRADE: Save order to state for the receipt
      setCompletedOrder({
        reference: posReference,
        date: new Date().toLocaleString(),
        items: [...cart],
        total: total,
        method: method
      });

      setCart([]); 
      
      // YOUR ORIGINAL DB RE-FETCH (Preserved!)
      const { data: updatedItems } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .gt('stock_quantity', 0);
      if (updatedItems) setProducts(updatedItems);

      // UPGRADE: Auto-Download Receipt Logic
      setTimeout(async () => {
        if (printReceiptRef.current) {
          try {
            setIsDownloading(true);
            printReceiptRef.current.classList.remove('hidden');
            const canvas = await html2canvas(printReceiptRef.current, { scale: 2 });
            printReceiptRef.current.classList.add('hidden');
            
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `Receipt_${posReference}.png`;
            link.click();
            
            toast.success("Receipt auto-downloaded for WhatsApp!");
          } catch (err) {
            console.error("Auto-download failed", err);
          } finally {
            setIsDownloading(false);
          }
        }
      }, 150);

    } catch (error: any) {
      console.error("POS Checkout Error:", error);
      toast.error("Failed to log order.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualDownload = async () => {
    if (!printReceiptRef.current) return;
    setIsDownloading(true);
    try {
      printReceiptRef.current.classList.remove('hidden');
      const canvas = await html2canvas(printReceiptRef.current, { scale: 2 });
      printReceiptRef.current.classList.add('hidden');

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Receipt_${completedOrder.reference}.png`;
      link.click();
    } catch (error) {
      toast.error("Failed to generate image");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-6.5rem)] relative">
      
      {/* INVISIBLE RECEIPT FOR PRINTING & DOWNLOADING */}
      {completedOrder && (
        <div 
          ref={printReceiptRef}
          className="hidden print:block absolute top-0 left-0 w-80 bg-white text-black font-mono text-sm z-50 p-6"
        >
          <div className="text-center mb-4">
            <h2 className="font-bold text-xl uppercase">{storeName}</h2>
            <p className="text-xs mt-1">Receipt: {completedOrder.reference}</p>
            <p className="text-xs">{completedOrder.date}</p>
          </div>
          <div className="border-b border-dashed border-black mb-4"></div>
          {completedOrder.items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-xs mb-2">
              <span>{item.cartQuantity}x {item.title}</span>
              <span>{sym}{(item.price * item.cartQuantity).toLocaleString()}</span>
            </div>
          ))}
          <div className="border-b border-dashed border-black my-4"></div>
          <div className="flex justify-between font-bold text-lg mb-2">
            <span>TOTAL ({completedOrder.method})</span>
            <span>{sym}{completedOrder.total.toLocaleString()}</span>
          </div>
          <div className="text-center text-[10px] mt-8 uppercase">
            <p>Thank you!</p>
            <p>Powered by LocalSoko</p>
          </div>
        </div>
      )}

      {/* LEFT PANEL - Added print:hidden */}
      <div className="order-2 lg:order-1 flex-1 flex flex-col min-h-[60vh] lg:min-h-0 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden print:hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search inventory by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          {isLoading ? (
             <div className="flex justify-center items-center h-full text-slate-400 font-medium">Loading POS...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {products
                .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="flex flex-col items-start p-3 sm:p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all text-left group active:scale-[0.98]"
                >
                  <div className="w-full aspect-square bg-slate-50 rounded-xl mb-3 overflow-hidden relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-8 w-8 text-slate-300" /></div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2">{product.title}</h3>
                  <p className="text-emerald-600 font-black text-sm mt-1">{sym}{product.price.toLocaleString()}</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1.5 bg-slate-50 px-2 py-0.5 rounded-md font-medium">{product.stock_quantity} in stock</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Added print:hidden & Success State Toggle */}
      <div className="order-1 lg:order-2 w-full lg:w-[400px] bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col h-[55vh] lg:h-full shrink-0 overflow-hidden print:hidden">
        
        {completedOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">Paid {sym}{completedOrder.total.toLocaleString()}</h2>
            <p className="text-sm font-medium text-slate-500 mb-8">Ref: {completedOrder.reference}</p>
            
            <div className="w-full space-y-3">
              <button 
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold transition-all"
              >
                <Printer className="h-5 w-5" /> Print Physical Receipt
              </button>
              
              <button 
                onClick={handleManualDownload}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold transition-all"
              >
                {isDownloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />} 
                Download Again
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-8 font-medium bg-slate-50 py-2 px-4 rounded-full">
              Tap any product to start next sale
            </p>
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="font-black text-lg flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-emerald-400" />
                Current Order
              </h2>
              <span className="bg-slate-800 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg">
                {cart.reduce((sum, item) => sum + item.cartQuantity, 0)} Items
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">Tap items to add to order</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-800 truncate">{item.title}</h4>
                      <p className="text-xs text-emerald-600 font-bold mt-0.5">{sym}{item.price.toLocaleString()}</p>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 active:scale-95"><Minus className="h-4 w-4" /></button>
                        <span className="font-black text-sm w-4 text-center">{item.cartQuantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 active:scale-95"><Plus className="h-4 w-4" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors active:scale-95">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 bg-white border-t border-slate-100">
              <div className="space-y-2 mb-5">
                <div className="flex justify-between text-sm text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span>{sym}{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500 font-medium">
                  <span>Tax (2%)</span>
                  <span>{sym}{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-emerald-600">{sym}{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleCheckout('Cash')}
                  className="flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-md shadow-slate-900/20"
                >
                  <Banknote className="h-5 w-5 text-emerald-400" /> Cash
                </button>
                <button 
                  onClick={() => handleCheckout('M-Pesa')}
                  className="flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-md shadow-emerald-600/20"
                >
                  <CreditCard className="h-5 w-5" /> M-Pesa
                </button>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}