"use client";

import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Store, MapPin, MessageCircle, ShoppingBag, Package } from "lucide-react";
import Link from "next/link";
import CheckoutButton from "./CheckoutButton";

// Next.js 15 Server Component for maximum SEO speed
export default async function PublicStorePage({ 
  params 
}: { 
  params: { store_slug: string } 
}) {
  
  // 1. Find the Store by the URL slug
  const { data: store } = await supabase
    .from('stores')
    .select('*, profiles(phone_number)')
    .eq('slug', params.store_slug)
    .single();

  if (!store) {
    notFound(); // Shows a 404 page if someone types a wrong store link
  }

  // 2. Fetch all IN-STOCK products for this specific store
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', store.id)
    .gt('stock_quantity', 0)
    .order('created_at', { ascending: false });

  // WhatsApp Checkout Link logic
  const storePhone = store.profiles?.phone_number || "254700000000"; 
  const waBaseUrl = `https://wa.me/${storePhone.replace('+', '')}?text=`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* STORE HEADER (Like a Shopify/Twitter Banner) */}
      <div className="bg-white border-b border-slate-200">
        <div className="h-32 md:h-48 bg-emerald-900 w-full relative overflow-hidden">
          {/* A cool background pattern for premium feel */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="relative -mt-12 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
            
            {/* Store Logo Avatar */}
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-white bg-slate-100 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
              <Store className="h-10 w-10 text-slate-400" />
            </div>
            
            {/* Store Info */}
            <div className="text-center md:text-left flex-1 pb-2">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">{store.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> Verified Retailer</span>
                <span className="flex items-center gap-1"><ShoppingBag className="h-4 w-4" /> {products?.length || 0} Products</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT GRID */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {(!products || products.length === 0) ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">Store is currently empty</h3>
            <p className="text-slate-500 mt-1">Check back later for new arrivals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => {
              // Create a pre-filled WhatsApp message for this specific item
              const message = encodeURIComponent(`Hi ${store.name}, I'm interested in buying your ${product.title} priced at Ksh ${product.price}. Is it still available?`);
              const buyLink = `${waBaseUrl}${message}`;

              return (
                <div key={product.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full">
                  
                  {/* Product Image */}
                  <div className="aspect-square bg-slate-100 relative overflow-hidden">
                    {product.images?.[0] ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center"><Package className="h-8 w-8 text-slate-300" /></div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-800 line-clamp-2 min-h-[2.5rem] leading-snug">{product.title}</h3>
                    
                    <div className="mt-3 flex items-center justify-between mb-4">
                      <span className="text-lg font-black text-emerald-600">Ksh {product.price.toLocaleString()}</span>
                    </div>
                    <CheckoutButton productId={product.id} storeName={store.name} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}